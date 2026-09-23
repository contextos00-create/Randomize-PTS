import { PtsCodeFile } from '../types';

export const DEFAULT_PTS_CODE_FILES: PtsCodeFile[] = [
  {
    id: 'harmonic-resonance',
    name: 'HarmonicResonance.tsx',
    description: 'Concentric harmonic spirals with dynamic frequency curvature',
    isDefault: true,
    code: `// Harmonic Resonance Canvas Kernel
// @param {slider} name="Ring Count" key="numRings" min=2 max=20 step=1 val=8 cat="function"
// @param {slider} name="Base Radius" key="baseRadius" min=20 max=220 step=2 val=75 cat="physics"
// @param {slider} name="Spiral Twist" key="spiralTwist" min=0.2 max=5 step=0.1 val=2.4 cat="behavior"
// @param {slider} name="Oscillation Speed" key="oscSpeed" min=0.1 max=3 step=0.1 val=1.2 cat="physics"
// @param {color} name="Glow Color A" key="primaryColor" val="#00f0ff" cat="look"
// @param {color} name="Glow Color B" key="secondaryColor" val="#ff0077" cat="look"

function render(form, space, time, v, pointer, isMouseDown) {
  const center = space.center;
  const numRings = Math.round(v.numRings || 8);
  const baseRadius = v.baseRadius || 75;
  const spiralTwist = v.spiralTwist || 2.4;
  const oscSpeed = v.oscSpeed || 1.2;
  const primaryColor = v.primaryColor || '#00f0ff';
  const secondaryColor = v.secondaryColor || '#ff0077';
  
  for (let i = 1; i <= numRings; i++) {
    const r = baseRadius * i * 0.35 + Math.sin(time * oscSpeed * 2 + i) * 14;
    const count = 10 + i * 4;
    const pts = [];
    
    for (let j = 0; j < count; j++) {
      const angle = (j / count) * Math.PI * 2 + (i % 2 === 0 ? time : -time) * (spiralTwist * 0.2);
      const px = center.x + Math.cos(angle) * r;
      const py = center.y + Math.sin(angle) * r;
      pts.push(new Pt(px, py));
    }
    
    const curve = Curve.catmullRom(Group.fromArray(pts), 4);
    form.stroke(i % 2 === 0 ? primaryColor : secondaryColor, 2).line(curve);
  }
}`,
  },
  {
    id: 'quantum-swarm',
    name: 'QuantumSwarm.tsx',
    description: 'Interactive particle swarm field with proximity velocity dampening',
    code: `// Quantum Swarm Field Kernel
// @param {slider} name="Particle Count" key="particleCount" min=20 max=200 step=5 val=80 cat="physics"
// @param {slider} name="Interaction Radius" key="interactRadius" min=40 max=300 step=5 val=130 cat="function"
// @param {slider} name="Jitter Strength" key="jitter" min=0.1 max=3 step=0.1 val=0.8 cat="behavior"
// @param {color} name="Particle Core" key="primaryColor" val="#38bdf8" cat="look"
// @param {color} name="Link Web" key="secondaryColor" val="#a855f7" cat="look"

function render(form, space, time, v, pointer, isMouseDown) {
  const center = space.center;
  const count = Math.round(v.particleCount || 80);
  const radius = v.interactRadius || 130;
  const jitter = v.jitter || 0.8;
  const primaryColor = v.primaryColor || '#38bdf8';
  const secondaryColor = v.secondaryColor || '#a855f7';
  
  const pts = [];
  for (let i = 0; i < count; i++) {
    const t = time * 0.5 + i * 0.2;
    const px = center.x + Math.cos(t * 1.3) * (space.width * 0.35) + Math.sin(t * 3.1) * (jitter * 20);
    const py = center.y + Math.sin(t * 1.7) * (space.height * 0.35) + Math.cos(t * 2.7) * (jitter * 20);
    pts.push(new Pt(px, py));
  }
  
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      const d = pts[i].$subtract(pts[j]).magnitude();
      if (d < radius) {
        const alpha = 1 - d / radius;
        form.stroke(secondaryColor, alpha * 1.5).line([pts[i], pts[j]]);
      }
    }
  }
  
  form.fill(primaryColor).points(pts, 3.5, 'circle');
}`,
  },
  {
    id: 'geometric-morph',
    name: 'GeometricMorph.tsx',
    description: 'Dynamic Delaunay tessellation and faceted polygonal morphing',
    code: `// Geometric Morph Delaunay Kernel
// @param {slider} name="Node Density" key="nodeDensity" min=10 max=80 step=2 val=32 cat="physics"
// @param {slider} name="Pulse Amplitude" key="pulseAmp" min=5 max=80 step=1 val=35 cat="function"
// @param {color} name="Facet Tint" key="primaryColor" val="#f97316" cat="look"
// @param {color} name="Edge Filament" key="secondaryColor" val="#fbbf24" cat="look"

function render(form, space, time, v, pointer, isMouseDown) {
  const center = space.center;
  const count = Math.round(v.nodeDensity || 32);
  const pulse = v.pulseAmp || 35;
  const primaryColor = v.primaryColor || '#f97316';
  const secondaryColor = v.secondaryColor || '#fbbf24';
  
  const pts = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const dist = 100 + Math.sin(time * 2 + i * 1.5) * pulse;
    const px = center.x + Math.cos(angle) * dist;
    const py = center.y + Math.sin(angle) * dist;
    pts.push(new Pt(px, py));
  }
  
  // Render interconnected geometric polygons
  for (let i = 0; i < pts.length; i++) {
    const next1 = pts[(i + 1) % pts.length];
    const next2 = pts[(i + 4) % pts.length];
    const tri = [pts[i], next1, center];
    form.fill('rgba(249, 115, 22, 0.12)').stroke(secondaryColor, 1).polygon(tri);
  }
  
  form.stroke(primaryColor, 2).polygon(pts);
}`,
  },
  {
    id: 'flow-ribbons',
    name: 'FlowRibbons.tsx',
    description: 'Fluid kinetic ribbons driven by attractor curves',
    code: `// Kinetic Flow Ribbons Kernel
// @param {slider} name="Ribbon Count" key="ribbonCount" min=3 max=16 step=1 val=7 cat="function"
// @param {slider} name="Wave Frequency" key="waveFreq" min=0.5 max=6 step=0.1 val=2.8 cat="physics"
// @param {slider} name="Ribbon Width" key="ribbonWidth" min=1 max=10 step=0.5 val=3 cat="look"
// @param {color} name="Flow Core" key="primaryColor" val="#ec4899" cat="look"
// @param {color} name="Flow Crest" key="secondaryColor" val="#8b5cf6" cat="look"

function render(form, space, time, v, pointer, isMouseDown) {
  const ribbons = Math.round(v.ribbonCount || 7);
  const freq = v.waveFreq || 2.8;
  const width = v.ribbonWidth || 3;
  const primaryColor = v.primaryColor || '#ec4899';
  const secondaryColor = v.secondaryColor || '#8b5cf6';
  
  for (let r = 0; r < ribbons; r++) {
    const pts = [];
    const steps = 24;
    const yOffset = (space.height / (ribbons + 1)) * (r + 1);
    
    for (let s = 0; s <= steps; s++) {
      const x = (space.width / steps) * s;
      const wave = Math.sin((x * 0.01 * freq) + time * 2 + r) * 45;
      pts.push(new Pt(x, yOffset + wave));
    }
    
    const curve = Curve.catmullRom(Group.fromArray(pts), 5);
    form.stroke(r % 2 === 0 ? primaryColor : secondaryColor, width).line(curve);
  }
}`,
  },
  {
    id: 'cosmic-attractor',
    name: 'CosmicAttractor.tsx',
    description: 'Clifford / Lorenz celestial orbital attractor points',
    code: `// Cosmic Attractor Kernel
// @param {slider} name="Orbit Speed" key="orbitSpeed" min=0.2 max=4 step=0.1 val=1.6 cat="physics"
// @param {slider} name="Point Cloud" key="cloudSize" min=40 max=300 step=10 val=120 cat="function"
// @param {slider} name="Scale Dimension" key="scaleDim" min=40 max=260 step=5 val=140 cat="behavior"
// @param {color} name="Orbit Hue A" key="primaryColor" val="#6366f1" cat="look"
// @param {color} name="Orbit Hue B" key="secondaryColor" val="#10b981" cat="look"

function render(form, space, time, v, pointer, isMouseDown) {
  const center = space.center;
  const speed = v.orbitSpeed || 1.6;
  const cloud = Math.round(v.cloudSize || 120);
  const scale = v.scaleDim || 140;
  const primaryColor = v.primaryColor || '#6366f1';
  const secondaryColor = v.secondaryColor || '#10b981';
  
  const a = 1.7, b = 1.8, c = -1.9, d = -0.4;
  let x = 0.1, y = 0.1;
  const pts = [];
  
  for (let i = 0; i < cloud; i++) {
    const nx = Math.sin(a * y + time * speed * 0.2) + c * Math.cos(a * x);
    const ny = Math.sin(b * x + time * speed * 0.2) + d * Math.cos(b * y);
    x = nx;
    y = ny;
    pts.push(new Pt(center.x + x * scale, center.y + y * scale));
  }
  
  form.stroke(primaryColor, 1).line(pts);
  form.fill(secondaryColor).points(pts, 2.5, 'circle');
}`,
  },
  {
    id: 'custom-scratchpad',
    name: 'CustomScratchpad.tsx',
    description: 'Empty starter canvas for building arbitrary Pts.js functions',
    code: `// Custom Pts.js Scratchpad
// Accessible globals: form, space, time, v, pointer, isMouseDown, Pt, Group, Curve, Geom, Circle, Triangle, Polygon
// @param {slider} name="Shape Count" key="shapeCount" min=3 max=24 step=1 val=6 cat="function"
// @param {slider} name="Radius" key="radius" min=20 max=200 step=5 val=80 cat="physics"
// @param {color} name="Stroke Color" key="strokeColor" val="#f59e0b" cat="look"

function render(form, space, time, v, pointer, isMouseDown) {
  const center = space.center;
  const count = Math.round(v.shapeCount || 6);
  const radius = v.radius || 80;
  const strokeColor = v.strokeColor || '#f59e0b';
  
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + time;
    const pt = center.$add(new Pt(Math.cos(angle) * radius, Math.sin(angle) * radius));
    form.stroke(strokeColor, 2).circle(Circle.fromCenter(pt, 16));
  }
}`,
  },
];
