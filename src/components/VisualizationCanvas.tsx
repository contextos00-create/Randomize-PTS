import React, { useEffect, useRef, useState, useCallback } from 'react';
import { CanvasSpace, CanvasForm, Pt, Group, Curve, Geom, Circle, Triangle, Polygon } from 'pts';
import {
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Minimize2,
  Camera,
  Sparkles,
  Layers,
  Code2,
} from 'lucide-react';
import { EngineType, CanvasLayer } from '../types';
import { variablesToMap } from '../engines/presets';

interface VisualizationCanvasProps {
  layers: CanvasLayer[];
  activeLayerId: string;
  onQuickRandomize?: () => void;
  isRandomizing?: boolean;
  onToggleCodeDrawer?: () => void;
  isCodeDrawerOpen?: boolean;
  onToggleLayersDrawer?: () => void;
  isLayersDrawerOpen?: boolean;
  children?: React.ReactNode;
}

export const VisualizationCanvas: React.FC<VisualizationCanvasProps> = ({
  layers,
  activeLayerId,
  onQuickRandomize,
  isRandomizing = false,
  onToggleCodeDrawer,
  isCodeDrawerOpen = false,
  onToggleLayersDrawer,
  isLayersDrawerOpen = false,
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spaceRef = useRef<CanvasSpace | null>(null);
  const formRef = useRef<CanvasForm | null>(null);

  // Real-time layers ref so the 60fps animate loop always reads latest layers & variables
  const layersRef = useRef<CanvasLayer[]>(layers);
  useEffect(() => {
    layersRef.current = layers;
  }, [layers]);

  // Simulation controls state
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [fps, setFps] = useState<number>(60);
  const [aspectRatio, setAspectRatio] = useState<'fit' | '16:9' | '1:1' | '4:3'>('fit');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [pointCount, setPointCount] = useState<number>(0);
  const [pointerPos, setPointerPos] = useState<{ x: number; y: number } | null>(null);
  const [snapshotSuccess, setSnapshotSuccess] = useState<boolean>(false);

  // Simulation persistent data per layer
  const stateRef = useRef<{
    layersParticles: Record<
      string,
      Array<{
        pos: Pt;
        vel: Pt;
        acc: Pt;
        home: Pt;
        color: string;
        radius: number;
        history: Pt[];
      }>
    >;
    layersTime: Record<string, number>;
    fpsCounter: number;
    fpsTimer: number;
  }>({
    layersParticles: {},
    layersTime: {},
    fpsCounter: 0,
    fpsTimer: 0,
  });

  // Cached compiled custom code functions per layer
  const compiledLayerFns = useRef<Record<string, { source: string; fn: Function }>>({});

  // Seed simulation for a specific layer
  const seedSimulationForLayer = useCallback((layer: CanvasLayer, width: number, height: number) => {
    const v = variablesToMap(layer.variables);
    const count = v.particleCount || v.nodeCount || v.ribbonCount || v.streamerCount || 75;
    const p: any[] = [];
    const pColor = v.primaryColor || '#00f0ff';
    const sColor = v.secondaryColor || '#ff0077';

    for (let i = 0; i < count; i++) {
      const x = Math.random() * (width || 800);
      const y = Math.random() * (height || 600);
      const angle = Math.random() * Math.PI * 2;
      const speed = (v.speed || 3.0) * (0.5 + Math.random() * 0.8);

      p.push({
        pos: new Pt(x, y),
        vel: new Pt(Math.cos(angle) * speed, Math.sin(angle) * speed),
        acc: new Pt(0, 0),
        home: new Pt(x, y),
        color: i % 2 === 0 ? pColor : sColor,
        radius: v.particleRadius || v.nodeRadius || 3.5,
        history: [],
      });
    }

    stateRef.current.layersParticles[layer.id] = p;
  }, []);

  // Initialize and mount Pts.js CanvasSpace
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Destroy existing space if any
    if (spaceRef.current) {
      spaceRef.current.removeAll();
      spaceRef.current.dispose();
      spaceRef.current = null;
    }

    const space = new CanvasSpace(canvas);
    const form = new CanvasForm(space);
    spaceRef.current = space;
    formRef.current = form;

    // Track mouse pointer
    let pointer = new Pt(-9999, -9999);
    let isMouseDown = false;

    space.add({
      start: (bound) => {
        layersRef.current.forEach((layer) => {
          seedSimulationForLayer(layer, bound.width, bound.height);
        });
      },

      animate: (time, ftime) => {
        const bound = space.size;
        const w = bound.x;
        const h = bound.y;
        if (w <= 0 || h <= 0) return;

        // Calculate FPS
        const now = performance.now();
        stateRef.current.fpsCounter++;
        if (now - stateRef.current.fpsTimer > 500) {
          setFps(
            Math.round((stateRef.current.fpsCounter * 1000) / (now - stateRef.current.fpsTimer))
          );
          stateRef.current.fpsCounter = 0;
          stateRef.current.fpsTimer = now;
        }

        const ctx = form.ctx;
        if (!ctx) return;

        // Clear background with base layer's bg and trailFade
        const activeOrFirst =
          layersRef.current.find((l) => l.id === activeLayerId) ||
          layersRef.current.find((l) => l.isVisible) ||
          layersRef.current[0];
        const baseVars = activeOrFirst ? variablesToMap(activeOrFirst.variables) : {};
        const bgColor = baseVars.bgColor || '#08090d';
        const trailFade = typeof baseVars.trailFade === 'number' ? baseVars.trailFade : 0.25;

        if (trailFade < 0.99) {
          ctx.fillStyle = bgColor;
          ctx.globalAlpha = trailFade;
          ctx.fillRect(0, 0, w, h);
          ctx.globalAlpha = 1.0;
        } else {
          form.fill(bgColor).rect([[0, 0], [w, h]]);
        }

        let totalPts = 0;

        // Render each visible layer in order (bottom to top)
        for (const layer of layersRef.current) {
          if (!layer.isVisible || layer.opacity <= 0) continue;

          ctx.save();
          ctx.globalAlpha = typeof layer.opacity === 'number' ? layer.opacity : 1.0;
          ctx.globalCompositeOperation = layer.blendMode || 'source-over';

          const v = variablesToMap(layer.variables);

          let lParticles = stateRef.current.layersParticles[layer.id];
          if (!lParticles || lParticles.length === 0) {
            seedSimulationForLayer(layer, w, h);
            lParticles = stateRef.current.layersParticles[layer.id] || [];
          }
          totalPts += lParticles.length;

          let lTime =
            (stateRef.current.layersTime[layer.id] || 0) +
            (ftime / 1000) * (v.timeScale || 1.0);
          stateRef.current.layersTime[layer.id] = lTime;
          const t = lTime;

          if (layer.engine === 'custom_code' && layer.customCode) {
            try {
              if (
                !compiledLayerFns.current[layer.id] ||
                compiledLayerFns.current[layer.id].source !== layer.customCode
              ) {
                const fn = new Function(
                  'form',
                  'space',
                  'time',
                  'v',
                  'pointer',
                  'isMouseDown',
                  'Pt',
                  'Group',
                  'Curve',
                  'Geom',
                  'Circle',
                  'Triangle',
                  'Polygon',
                  `${layer.customCode}\nif (typeof render === "function") render(form, space, time, v, pointer, isMouseDown);`
                );
                compiledLayerFns.current[layer.id] = { source: layer.customCode, fn };
              }
              compiledLayerFns.current[layer.id].fn(
                form,
                space,
                t,
                v,
                pointer,
                isMouseDown,
                Pt,
                Group,
                Curve,
                Geom,
                Circle,
                Triangle,
                Polygon
              );
            } catch (err: any) {
              ctx.fillStyle = 'rgba(239, 68, 68, 0.85)';
              ctx.font = '10px monospace';
              ctx.fillText(`[${layer.name}] Code Error: ${err.message}`, 16, 24);
            }
          } else {
            if (layer.engine === 'particle_swarm') {
              renderParticleSwarm(form, ctx, w, h, t, v, pointer, isMouseDown, lParticles);
            } else if (layer.engine === 'harmonic_mesh') {
              renderHarmonicMesh(form, ctx, w, h, t, v, pointer, lParticles);
            } else if (layer.engine === 'geometric_delaunay') {
              renderGeometricDelaunay(form, ctx, w, h, t, v, pointer, isMouseDown, lParticles);
            } else if (layer.engine === 'kinetic_ribbons') {
              renderKineticRibbons(form, ctx, w, h, t, v, pointer, lParticles);
            } else if (layer.engine === 'cosmic_attractor') {
              renderCosmicAttractor(form, ctx, w, h, t, v, pointer, isMouseDown, lParticles);
            }
          }

          ctx.restore();
        }

        setPointCount(totalPts);
      },

      action: (type, px, py) => {
        pointer = new Pt(px, py);
        setPointerPos({ x: Math.round(px), y: Math.round(py) });
        if (type === 'down') isMouseDown = true;
        if (type === 'up') isMouseDown = false;
        if (type === 'out') {
          pointer = new Pt(-9999, -9999);
          setPointerPos(null);
          isMouseDown = false;
        }
      },

      resize: (bound) => {
        layersRef.current.forEach((layer) => {
          seedSimulationForLayer(layer, bound.width, bound.height);
        });
      },
    });

    space.bindMouse().bindTouch();
    space.play();

    return () => {
      space.removeAll();
      space.dispose();
      spaceRef.current = null;
      formRef.current = null;
    };
  }, [seedSimulationForLayer, activeLayerId]);

  // Handle Play/Pause
  const togglePlay = () => {
    if (!spaceRef.current) return;
    if (isPlaying) {
      spaceRef.current.pause();
      setIsPlaying(false);
    } else {
      spaceRef.current.resume();
      setIsPlaying(true);
    }
  };

  // Handle Reset Simulation
  const handleReset = () => {
    if (!spaceRef.current) return;
    const bound = spaceRef.current.size;
    layersRef.current.forEach((layer) => {
      seedSimulationForLayer(layer, bound.x, bound.y);
    });
  };

  // High-Res Snapshot Export
  const takeSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `pts-visualization-${Date.now()}.png`;
      a.click();
      setSnapshotSuccess(true);
      setTimeout(() => setSnapshotSuccess(false), 2000);
    } catch (e) {
      console.error('Error capturing snapshot', e);
    }
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => console.error(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => console.error(err));
      setIsFullscreen(false);
    }
  };

  // ====================================================
  // Helper renderers for each engine using Pts.js
  // ====================================================

  const renderParticleSwarm = (
    form: CanvasForm,
    ctx: any,
    w: number,
    h: number,
    t: number,
    v: Record<string, any>,
    pointer: Pt,
    isMouseDown: boolean,
    particles: any[]
  ) => {
    const maxSpeed = v.speed || 4.5;
    const damping = v.damping || 0.94;
    const gravity = v.gravity || 0.65;
    const springStiffness = v.springStiffness || 0.04;
    const noiseScale = v.noiseScale || 0.004;
    const wanderStrength = v.wanderStrength || 0.45;
    const connectDist = v.connectDistance || 75;
    const glowRadius = v.glowRadius || 12;
    const bounce = v.bounceWall !== false;
    const shape = v.shapeType || 'circle';
    const primaryColor = v.primaryColor || '#00f0ff';
    const secondaryColor = v.secondaryColor || '#ff0077';

    ctx.shadowBlur = glowRadius;
    ctx.shadowColor = primaryColor;

    if (connectDist > 0 && particles.length <= 250) {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const p1 = particles[i].pos;
          const p2 = particles[j].pos;
          const dist = p1.$subtract(p2).magnitude();
          if (dist < connectDist) {
            const alpha = (1 - dist / connectDist) * 0.45;
            form.stroke(`rgba(255, 255, 255, ${alpha.toFixed(2)})`, 1).line([p1, p2]);
          }
        }
      }
    }

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      const angle =
        Math.sin(p.pos.x * noiseScale + t) * Math.PI +
        Math.cos(p.pos.y * noiseScale + t * 0.8) * Math.PI;
      p.acc = new Pt(Math.cos(angle) * wanderStrength, Math.sin(angle) * wanderStrength);

      if (springStiffness > 0) {
        const springForce = p.home.$subtract(p.pos).multiply(springStiffness);
        p.acc.add(springForce);
      }

      if (pointer.x > 0 && pointer.y > 0) {
        const dir = pointer.$subtract(p.pos);
        const dist = Math.max(25, dir.magnitude());
        if (dist < 320) {
          const forceMag = ((320 - dist) / 320) * gravity * (isMouseDown ? 3.0 : 1.5);
          p.acc.add(dir.unit().multiply(forceMag));
        }
      }

      p.vel.add(p.acc);
      p.vel.multiply(damping);

      const curSpeed = p.vel.magnitude();
      if (curSpeed > maxSpeed) {
        p.vel = p.vel.unit().multiply(maxSpeed);
      }

      p.pos.add(p.vel);

      if (bounce) {
        if (p.pos.x < 0) {
          p.pos.x = 0;
          p.vel.x *= -1;
        }
        if (p.pos.x > w) {
          p.pos.x = w;
          p.vel.x *= -1;
        }
        if (p.pos.y < 0) {
          p.pos.y = 0;
          p.vel.y *= -1;
        }
        if (p.pos.y > h) {
          p.pos.y = h;
          p.vel.y *= -1;
        }
      } else {
        if (p.pos.x < 0) p.pos.x = w;
        if (p.pos.x > w) p.pos.x = 0;
        if (p.pos.y < 0) p.pos.y = h;
        if (p.pos.y > h) p.pos.y = 0;
      }

      const pColor = i % 2 === 0 ? primaryColor : secondaryColor;
      form.fill(pColor).stroke(false);

      if (shape === 'circle') {
        form.point(p.pos, p.radius, 'circle');
      } else if (shape === 'square') {
        form.point(p.pos, p.radius, 'square');
      } else if (shape === 'ring') {
        form.stroke(pColor, 1.5).fill(false).point(p.pos, p.radius, 'circle');
      } else {
        const tri = Triangle.fromCenter(p.pos, p.radius * 1.5);
        form.polygon(tri);
      }
    }

    ctx.shadowBlur = 0;
  };

  const renderHarmonicMesh = (
    form: CanvasForm,
    ctx: any,
    w: number,
    h: number,
    t: number,
    v: Record<string, any>,
    pointer: Pt,
    particles: any[]
  ) => {
    const waveFreq = v.waveFrequency || 0.04;
    const waveAmp = v.waveAmplitude || 35;
    const rows = v.gridRows || 12;
    const cols = v.gridCols || 16;
    const strokeWidth = v.strokeWidth || 1.8;
    const primaryColor = v.primaryColor || '#00ff88';
    const secondaryColor = v.secondaryColor || '#7928ca';
    const fillCells = v.fillMeshCells === true;
    const mouseDeform = v.mouseDeform || 80;

    const cellW = w / (cols + 1);
    const cellH = h / (rows + 1);

    const gridPts: Pt[][] = [];

    for (let r = 0; r <= rows; r++) {
      gridPts[r] = [];
      for (let c = 0; c <= cols; c++) {
        const baseX = (c + 0.5) * cellW;
        const baseY = (r + 0.5) * cellH;

        const wave =
          Math.sin(c * waveFreq * 10 + t * 2) *
          Math.cos(r * waveFreq * 10 + t * 1.5) *
          waveAmp;

        let pt = new Pt(baseX, baseY + wave);

        if (pointer.x > 0 && pointer.y > 0) {
          const dist = pt.$subtract(pointer).magnitude();
          if (dist < 220) {
            const push = ((220 - dist) / 220) * mouseDeform;
            pt.add(pt.$subtract(pointer).unit().multiply(push));
          }
        }

        gridPts[r][c] = pt;
      }
    }

    for (let r = 0; r <= rows; r++) {
      const linePts = Group.fromArray(gridPts[r]);
      const curve = Curve.catmullRom(linePts, 4);
      form.stroke(primaryColor, strokeWidth).line(curve);
    }

    for (let c = 0; c <= cols; c++) {
      const colPts: Pt[] = [];
      for (let r = 0; r <= rows; r++) {
        colPts.push(gridPts[r][c]);
      }
      const curve = Curve.catmullRom(Group.fromArray(colPts), 4);
      form.stroke(secondaryColor, strokeWidth * 0.8).line(curve);
    }

    if (fillCells) {
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if ((r + c) % 2 === 0) {
            const quad = Group.fromArray([
              gridPts[r][c],
              gridPts[r][c + 1],
              gridPts[r + 1][c + 1],
              gridPts[r + 1][c],
            ]);
            form.fill('rgba(121, 40, 202, 0.12)').stroke(false).polygon(quad);
          }
        }
      }
    }
  };

  const renderGeometricDelaunay = (
    form: CanvasForm,
    ctx: any,
    w: number,
    h: number,
    t: number,
    v: Record<string, any>,
    pointer: Pt,
    isMouseDown: boolean,
    particles: any[]
  ) => {
    const primaryColor = v.primaryColor || '#ff4d00';
    const secondaryColor = v.secondaryColor || '#ffd000';
    const nodeSpeed = v.nodeSpeed || 1.8;
    const threshold = v.edgeThreshold || 120;
    const drawCircumcircles = v.drawCircumcircles === true;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.pos.add(p.vel.unit().multiply(nodeSpeed));

      if (p.pos.x < 0 || p.pos.x > w) p.vel.x *= -1;
      if (p.pos.y < 0 || p.pos.y > h) p.vel.y *= -1;
    }

    const pts = particles.map((p) => p.pos);
    if (pointer.x > 0 && pointer.y > 0) {
      pts.push(pointer);
    }

    const n = Math.min(pts.length, 65);
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const d1 = pts[i].$subtract(pts[j]).magnitude();
        if (d1 < threshold) {
          for (let k = j + 1; k < n; k++) {
            const d2 = pts[j].$subtract(pts[k]).magnitude();
            const d3 = pts[k].$subtract(pts[i]).magnitude();

            if (d2 < threshold && d3 < threshold) {
              const tri = Group.fromArray([pts[i], pts[j], pts[k]]);
              const alpha = 1 - (d1 + d2 + d3) / (threshold * 3);

              form
                .fill(`rgba(255, 77, 0, ${(alpha * 0.22).toFixed(2)})`)
                .stroke(`rgba(255, 208, 0, ${(alpha * 0.7).toFixed(2)})`, 1)
                .polygon(tri);

              if (drawCircumcircles && alpha > 0.6) {
                const cc = Triangle.circumcircle(tri);
                if (cc) {
                  form.stroke('rgba(255, 255, 255, 0.1)', 1).fill(false).circle(cc);
                }
              }
            }
          }
        }
      }
    }

    form.fill(secondaryColor).stroke(primaryColor, 1.5).points(pts, 3.5, 'circle');
  };

  const renderKineticRibbons = (
    form: CanvasForm,
    ctx: any,
    w: number,
    h: number,
    t: number,
    v: Record<string, any>,
    pointer: Pt,
    particles: any[]
  ) => {
    const trailLength = v.trailLength || 25;
    const ribbonWidth = v.ribbonWidth || 3.5;
    const curvature = v.curlTension || 0.005;
    const primaryColor = v.primaryColor || '#ff3366';
    const secondaryColor = v.secondaryColor || '#33ccff';
    const orbitalSpeed = v.orbitalSpeed || 2.2;

    const center = new Pt(w / 2, h / 2);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const offset = (i / particles.length) * Math.PI * 2;

      const angle = t * orbitalSpeed + offset;
      const radius = 100 + Math.sin(t * 1.5 + offset * 3) * (w * 0.28);

      const targetX = center.x + Math.cos(angle) * radius;
      const targetY = center.y + Math.sin(angle * 1.3) * radius;
      const target = new Pt(targetX, targetY);

      if (pointer.x > 0 && pointer.y > 0) {
        const pDist = target.$subtract(pointer).magnitude();
        if (pDist < 160) {
          target.add(target.$subtract(pointer).unit().multiply((160 - pDist) * 0.6));
        }
      }

      p.pos = p.pos.$add(target.$subtract(p.pos).multiply(0.12));

      p.history.push(p.pos.clone());
      if (p.history.length > trailLength) {
        p.history.shift();
      }

      if (p.history.length > 3) {
        const ribbonGroup = Group.fromArray(p.history);
        const curve = Curve.catmullRom(ribbonGroup, 4);

        const color = i % 2 === 0 ? primaryColor : secondaryColor;
        form.stroke(color, ribbonWidth).line(curve);
      }
    }
  };

  const renderCosmicAttractor = (
    form: CanvasForm,
    ctx: any,
    w: number,
    h: number,
    t: number,
    v: Record<string, any>,
    pointer: Pt,
    isMouseDown: boolean,
    particles: any[]
  ) => {
    const numPoles = v.numPoles || 3;
    const poleStrength = v.poleStrength || 120;
    const spinFactor = v.spinFactor || 1.5;
    const primaryColor = v.primaryColor || '#10b981';
    const secondaryColor = v.secondaryColor || '#34d399';
    const drawFieldLines = v.drawFieldLines !== false;

    const poles: Pt[] = [];
    const center = new Pt(w / 2, h / 2);
    const radius = Math.min(w, h) * 0.3;

    for (let p = 0; p < numPoles; p++) {
      const ang = (p / numPoles) * Math.PI * 2 + t * 0.3;
      poles.push(new Pt(center.x + Math.cos(ang) * radius, center.y + Math.sin(ang) * radius));
    }

    if (pointer.x > 0 && pointer.y > 0) {
      poles.push(pointer);
    }

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      let totalForce = new Pt(0, 0);

      for (let k = 0; k < poles.length; k++) {
        const pole = poles[k];
        const dir = pole.$subtract(p.pos);
        const dist = Math.max(20, dir.magnitude());
        const force = (poleStrength / (dist * dist)) * 80;

        const tangent = new Pt(-dir.y, dir.x).unit().multiply(force * spinFactor);
        const pull = dir.unit().multiply(force);

        totalForce.add(pull).add(tangent);
      }

      p.acc = totalForce;
      p.vel.add(p.acc);
      p.vel.multiply(0.96);
      p.pos.add(p.vel);

      p.history.push(p.pos.clone());
      if (p.history.length > 12) {
        p.history.shift();
      }

      if (p.history.length > 2) {
        const color = i % 2 === 0 ? primaryColor : secondaryColor;
        form.stroke(color, 1.2).line(Group.fromArray(p.history));
      }
    }

    if (drawFieldLines) {
      form.fill('rgba(16, 185, 129, 0.4)').stroke('#ffffff', 1.5).points(poles, 6, 'circle');
    }
  };

  // Helper aspect ratio classes
  const getAspectClass = () => {
    if (aspectRatio === '16:9') return 'aspect-[16/9]';
    if (aspectRatio === '1:1') return 'aspect-square';
    if (aspectRatio === '4:3') return 'aspect-[4/3]';
    return 'h-full';
  };

  return (
    <div
      ref={containerRef}
      id="preview-canvas-container"
      className="relative flex flex-col h-full bg-white border border-zinc-200/90 rounded-2xl overflow-hidden shadow-xs transition-all"
    >
      {/* Top Canvas Header Bar */}
      <div
        id="canvas-header-bar"
        className="flex items-center justify-between px-3.5 py-2.5 bg-zinc-50/70 border-b border-zinc-200/80 select-none z-10"
      >
        <div className="flex items-center gap-2">
          {/* Left: Code Drawer Toggle Button (Slides out from left across visualization frame) */}
          {onToggleCodeDrawer && (
            <button
              id="btn-toggle-code-drawer"
              onClick={onToggleCodeDrawer}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-3xs font-medium border transition-all shadow-2xs ${
                isCodeDrawerOpen
                  ? 'bg-zinc-900 text-white border-zinc-900 font-semibold shadow-xs'
                  : 'bg-white hover:bg-zinc-100 text-zinc-700 border-zinc-250 hover:text-zinc-900'
              }`}
              title="Toggle Pts.js Code Drawer (slides from left into visualization frame)"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Pts Code</span>
            </button>
          )}

          <div className="w-px h-4 bg-zinc-200 hidden sm:block"></div>

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white border border-zinc-250 text-zinc-800 text-3xs font-mono font-medium shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>PTS.JS ENGINE</span>
          </div>

          <div className="text-3xs text-zinc-500 font-mono hidden md:flex items-center gap-2.5">
            <span>
              FPS: <strong className="text-zinc-800">{fps}</strong>
            </span>
            <span>
              Points: <strong className="text-zinc-800">{pointCount}</strong>
            </span>
            {pointerPos && (
              <span className="text-zinc-400">
                X: {pointerPos.x} Y: {pointerPos.y}
              </span>
            )}
          </div>
        </div>

        {/* Right Header Tools: Layers Drawer Toggle, Aspect, Snapshot, Fullscreen */}
        <div className="flex items-center gap-1.5">
          {/* Right: Layers Drawer Toggle Button (Slides out from right across visualization frame) */}
          {onToggleLayersDrawer && (
            <button
              id="btn-toggle-layers-drawer"
              onClick={onToggleLayersDrawer}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-3xs font-medium border transition-all shadow-2xs ${
                isLayersDrawerOpen
                  ? 'bg-zinc-900 text-white border-zinc-900 font-semibold shadow-xs'
                  : 'bg-white hover:bg-zinc-100 text-zinc-700 border-zinc-250 hover:text-zinc-900'
              }`}
              title="Toggle Layers Drawer (slides from right into visualization frame)"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Layers</span>
              <span
                className={`px-1 py-0.2 rounded-full text-4xs font-mono ${
                  isLayersDrawerOpen
                    ? 'bg-zinc-800 text-zinc-200'
                    : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                }`}
              >
                {layers.length}
              </span>
            </button>
          )}

          <div className="w-px h-4 bg-zinc-200 hidden sm:block"></div>

          {/* Aspect Ratio Switcher */}
          <div className="flex items-center rounded-md bg-zinc-100 p-0.5 border border-zinc-200 text-3xs text-zinc-600">
            <button
              id="btn-aspect-fit"
              onClick={() => setAspectRatio('fit')}
              className={`px-2 py-0.5 rounded transition-all ${
                aspectRatio === 'fit'
                  ? 'bg-white text-zinc-900 font-semibold shadow-2xs'
                  : 'hover:text-zinc-900'
              }`}
              title="Adaptive viewport filling"
            >
              Fit
            </button>
            <button
              id="btn-aspect-16-9"
              onClick={() => setAspectRatio('16:9')}
              className={`px-2 py-0.5 rounded transition-all ${
                aspectRatio === '16:9'
                  ? 'bg-white text-zinc-900 font-semibold shadow-2xs'
                  : 'hover:text-zinc-900'
              }`}
              title="16:9 Cinema"
            >
              16:9
            </button>
            <button
              id="btn-aspect-1-1"
              onClick={() => setAspectRatio('1:1')}
              className={`px-2 py-0.5 rounded transition-all ${
                aspectRatio === '1:1'
                  ? 'bg-white text-zinc-900 font-semibold shadow-2xs'
                  : 'hover:text-zinc-900'
              }`}
              title="1:1 Square"
            >
              1:1
            </button>
          </div>

          {/* Quick Snapshot PNG */}
          <button
            id="btn-snapshot"
            onClick={takeSnapshot}
            className={`p-1.5 rounded-md border transition-all text-3xs flex items-center gap-1 ${
              snapshotSuccess
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                : 'bg-white hover:bg-zinc-100 border-zinc-250 text-zinc-700'
            }`}
            title="Export high-resolution PNG snapshot"
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">{snapshotSuccess ? 'Saved!' : 'Snap'}</span>
          </button>

          {/* Fullscreen */}
          <button
            id="btn-fullscreen"
            onClick={toggleFullscreen}
            className="p-1.5 rounded-md bg-white hover:bg-zinc-100 border border-zinc-250 text-zinc-700 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Canvas'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Canvas Viewport Area */}
      <div className="relative flex-1 flex items-center justify-center p-2 sm:p-3 overflow-hidden bg-zinc-100/70">
        <div
          className={`w-full max-w-full relative transition-all duration-300 flex items-center justify-center ${getAspectClass()}`}
        >
          <canvas
            ref={canvasRef}
            id="pts-main-canvas"
            className="w-full h-full block rounded-xl cursor-crosshair shadow-sm border border-zinc-200/80"
          />

          {/* Pulsing Randomize overlay indicator */}
          {isRandomizing && (
            <div className="absolute inset-0 bg-white/40 backdrop-blur-2xs rounded-xl flex items-center justify-center pointer-events-none transition-opacity duration-300">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 border border-zinc-300 text-zinc-900 text-xs font-mono shadow-md animate-bounce">
                <Sparkles className="w-3.5 h-3.5 text-zinc-700 animate-spin" />
                <span>Re-rolling Parameters...</span>
              </div>
            </div>
          )}
        </div>

        {/* Floating Bottom Toolbar on Canvas */}
        <div
          id="canvas-bottom-floating-toolbar"
          className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 border border-zinc-250 backdrop-blur-md shadow-md z-10 text-zinc-700"
        >
          {/* Play/Pause */}
          <button
            id="btn-toggle-play"
            onClick={togglePlay}
            className="p-1.5 rounded-full hover:bg-zinc-100 text-zinc-700 hover:text-black transition-colors"
            title={isPlaying ? 'Pause Simulation (Space)' : 'Play Simulation (Space)'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          </button>

          {/* Re-seed / Reset */}
          <button
            id="btn-reset-simulation"
            onClick={handleReset}
            className="p-1.5 rounded-full hover:bg-zinc-100 text-zinc-700 hover:text-black transition-colors"
            title="Reset Simulation Positions"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-3.5 bg-zinc-250 mx-0.5"></div>

          {/* Quick Randomize Trigger */}
          {onQuickRandomize && (
            <button
              id="btn-canvas-quick-randomize"
              onClick={onQuickRandomize}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 hover:bg-black text-white font-medium text-3xs shadow-xs transition-all active:scale-95"
              title="Randomize active layers"
            >
              <Sparkles className="w-3 h-3 text-zinc-300" />
              <span>Randomize</span>
            </button>
          )}
        </div>

        {/* Slide-out Drawers rendered directly inside the visualization frame */}
        {children}
      </div>
    </div>
  );
};
