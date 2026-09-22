import React, { useState, useEffect } from 'react';
import {
  Code2,
  Play,
  RotateCcw,
  Sparkles,
  Check,
  AlertCircle,
  HelpCircle,
  FileCode,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { DynamicVariable, ParameterCategory } from '../types';

interface CodeEditorProps {
  code: string;
  onChangeCode: (code: string) => void;
  onRunAndSync: (code: string) => void;
  variables: DynamicVariable[];
  onOpenAiHelp: () => void;
  executionError: string | null;
}

const PRESET_TEMPLATES: { name: string; desc: string; code: string }[] = [
  {
    name: 'Harmonic Lissajous Ribbons',
    desc: 'Fourier frequency curves with dynamic amplitude and stroke tension',
    code: `// Custom Low-Level Pts.js Harmonic Lissajous
// @param {slider} name="Lissajous A" key="lissA" min=1 max=10 step=1 val=3 cat="function"
// @param {slider} name="Lissajous B" key="lissB" min=1 max=10 step=1 val=4 cat="function"
// @param {slider} name="Wave Amplitude" key="waveAmp" min=40 max=220 step=5 val=130 cat="function"
// @param {color} name="Ribbon Tint" key="ribbonTint" val="#6366f1" cat="look"

function render(form, space, time, v, pointer) {
  const center = space.center;
  const a = v.lissA || 3;
  const b = v.lissB || 4;
  const amp = v.waveAmp || 130;
  const tint = v.ribbonTint || '#6366f1';

  // Synthesize parametric points along Lissajous path
  const pts = Group.make(60, (i) => {
    const t = (i / 60) * Math.PI * 2;
    const x = Math.sin(a * t + time * 0.8) * amp;
    const y = Math.sin(b * t) * amp;
    return center.$add(new Pt(x, y));
  });

  // Smooth Catmull-Rom spline with Pts.js
  const curve = Curve.catmullRom(pts, 4);
  form.stroke(tint, 2.5).line(curve);

  // Geometric vertices
  form.fill("#18181b").stroke(tint, 1.5).points(pts, 3, "circle");
}`,
  },
  {
    name: 'Curl Vector Swirl Streamlines',
    desc: 'Trigonometric curl vortex field with orbital angular velocity',
    code: `// Low-Level Pts.js Curl Vortex Streamlines
// @param {slider} name="Vortex Spin" key="vortexSpin" min=0.5 max=5 step=0.1 val=2 cat="physics"
// @param {slider} name="Radial Reach" key="radReach" min=60 max=300 step=10 val=160 cat="function"
// @param {color} name="Core Glow" key="coreGlow" val="#0ea5e9" cat="look"
// @param {toggle} name="Draw Spokes" key="drawSpokes" val=true cat="attributes"

function render(form, space, time, v, pointer) {
  const center = space.center;
  const spin = v.vortexSpin || 2;
  const reach = v.radReach || 160;
  const glow = v.coreGlow || '#0ea5e9';
  const drawSpokes = v.drawSpokes !== false;

  const rings = 5;
  for (let r = 1; r <= rings; r++) {
    const ringRadius = (reach / rings) * r;
    const count = r * 8;
    const ringPts = Group.make(count, (i) => {
      const angle = (i / count) * Math.PI * 2 + time * (spin / r);
      return center.$add(new Pt(Math.cos(angle) * ringRadius, Math.sin(angle) * ringRadius));
    });

    form.stroke(glow, 1.2).polygon(ringPts);

    if (drawSpokes && r === rings) {
      for (const p of ringPts) {
        form.stroke("rgba(14, 165, 233, 0.2)", 1).line([center, p]);
      }
    }
  }

  // Singular anchor
  form.fill(glow).point(center, 4, "circle");
}`,
  },
  {
    name: 'Phyllotaxis Golden Spiral',
    desc: 'Nature-inspired Fibonacci flower petal distribution',
    code: `// Pts.js Golden Ratio Phyllotaxis Lattice
// @param {slider} name="Golden Divergence" key="divergence" min=137 max=138 step=0.05 val=137.5 cat="function"
// @param {slider} name="Spiral Scale" key="spiralScale" min=4 max=18 step=0.5 val=9 cat="function"
// @param {color} name="Petal Accent" key="petalAccent" val="#ec4899" cat="look"
// @param {slider} name="Petal Size" key="petalSize" min=2 max=8 step=0.5 val=4 cat="attributes"

function render(form, space, time, v, pointer) {
  const center = space.center;
  const c = v.spiralScale || 9;
  const divAngle = (v.divergence || 137.5) * (Math.PI / 180);
  const color = v.petalAccent || '#ec4899';
  const radius = v.petalSize || 4;

  const total = 90;
  for (let n = 0; n < total; n++) {
    const a = n * divAngle + time * 0.15;
    const r = c * Math.sqrt(n);
    const p = center.$add(new Pt(Math.cos(a) * r, Math.sin(a) * r));

    const alpha = (1 - n / total) * 0.8 + 0.2;
    form.fill(color).stroke("#ffffff", 1).point(p, radius * (1 - n / (total * 1.5)), "circle");
  }
}`,
  },
];

export const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  onChangeCode,
  onRunAndSync,
  variables,
  onOpenAiHelp,
  executionError,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleRun = () => {
    onRunAndSync(code);
    setStatusMessage('Function evaluated & parameters synchronized.');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleSelectTemplate = (templateName: string) => {
    setSelectedTemplate(templateName);
    const t = PRESET_TEMPLATES.find((item) => item.name === templateName);
    if (t) {
      onChangeCode(t.code);
      onRunAndSync(t.code);
      setStatusMessage(`Loaded template: "${t.name}"`);
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  // Keyboard shortcut: Cmd+Enter or Ctrl+Enter to run code
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRun();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [code, onRunAndSync]);

  return (
    <div
      id="pts-code-editor-panel"
      className="flex flex-col h-full bg-white border border-zinc-200/90 rounded-2xl shadow-xs overflow-hidden text-zinc-900"
    >
      {/* Editor Header & Control Bar */}
      <div className="px-3.5 py-2.5 border-b border-zinc-200/80 bg-zinc-50/50 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-zinc-900 flex items-center justify-center text-white">
            <Code2 className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-semibold tracking-wide text-zinc-900">
              Pts.js Function Sandbox
            </h3>
            <span className="text-4xs font-mono text-zinc-500">
              Exports low-level algorithms to dynamic variables
            </span>
          </div>
        </div>

        {/* Action Controls: Template, AI Help, Run & Sync */}
        <div className="flex items-center gap-2">
          {/* Preset Function Selector */}
          <div className="relative">
            <select
              value={selectedTemplate}
              onChange={(e) => handleSelectTemplate(e.target.value)}
              className="appearance-none pl-2.5 pr-7 py-1 text-3xs rounded-md bg-white border border-zinc-300 text-zinc-700 hover:text-zinc-900 cursor-pointer focus:outline-hidden"
            >
              <option value="" disabled>
                Preset Functions...
              </option>
              {PRESET_TEMPLATES.map((t) => (
                <option key={t.name} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-zinc-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* AI Help Button */}
          <button
            id="btn-ai-help"
            onClick={onOpenAiHelp}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-3xs font-semibold bg-violet-50 hover:bg-violet-100 border border-violet-200 text-violet-700 transition-colors shadow-2xs"
            title="Ask AI to write custom Pts.js functions or parameters"
          >
            <Sparkles className="w-3.5 h-3.5 text-violet-600" />
            <span>AI Help</span>
          </button>

          {/* Run & Sync Button */}
          <button
            id="btn-run-code"
            onClick={handleRun}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md text-3xs font-semibold bg-zinc-900 hover:bg-black text-white transition-all shadow-xs"
            title="Evaluate code and sync dynamic variables (Ctrl+Enter)"
          >
            <Play className="w-3 h-3 text-white fill-current" />
            <span>Run & Sync</span>
            <kbd className="hidden md:inline text-4xs font-mono text-zinc-400 ml-0.5">
              ⌘↵
            </kbd>
          </button>
        </div>
      </div>

      {/* Editor Help Hint Bar */}
      <div className="px-3.5 py-1.5 bg-zinc-50 border-b border-zinc-200/60 text-4xs font-mono text-zinc-500 flex items-center justify-between">
        <span className="truncate">
          Format: <code className="text-zinc-700 font-semibold">// @param &#123;slider|color|toggle&#125; name="..." key="..." min=.. max=.. val=.. cat="physics|function|look"</code>
        </span>
        <span className="shrink-0 text-zinc-400 ml-2">
          Max 20 variables ({variables.length}/20)
        </span>
      </div>

      {/* Code Textarea Area with Line Numbers */}
      <div className="flex-1 relative flex overflow-hidden font-mono text-xs bg-white">
        <textarea
          value={code}
          onChange={(e) => onChangeCode(e.target.value)}
          placeholder="// Write your low-level Pts.js function here..."
          spellCheck={false}
          className="w-full h-full p-4 font-mono text-xs leading-relaxed text-zinc-900 bg-transparent resize-none focus:outline-hidden selection:bg-zinc-200"
          style={{ tabSize: 2 }}
        />
      </div>

      {/* Execution Error or Status Message Banner */}
      {executionError ? (
        <div className="px-3 py-2 bg-red-50 border-t border-red-200 text-3xs text-red-700 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-600" />
          <span className="truncate">Execution error: {executionError}</span>
        </div>
      ) : statusMessage ? (
        <div className="px-3 py-1.5 bg-emerald-50 border-t border-emerald-200 text-3xs text-emerald-800 flex items-center gap-1.5 animate-in fade-in duration-200">
          <Check className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
          <span>{statusMessage}</span>
        </div>
      ) : (
        <div className="px-3 py-1.5 bg-zinc-50/60 border-t border-zinc-200/60 text-4xs text-zinc-500 flex items-center justify-between">
          <span>Pts.js 1.0.1 • Context: form, space, time, v, pointer</span>
          <span>Press ⌘+Enter to update canvas and variables</span>
        </div>
      )}
    </div>
  );
};
