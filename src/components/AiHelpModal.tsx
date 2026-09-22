import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Send,
  Loader2,
  Code2,
  Check,
  Lightbulb,
  Cpu,
  Layers,
  HelpCircle,
  Copy,
  ArrowRight,
} from 'lucide-react';
import { DynamicVariable, EngineType } from '../types';

interface AiHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCode: string;
  engine: EngineType;
  variables: DynamicVariable[];
  onApplyCode: (code: string, newVariables?: any[]) => void;
}

const INSPIRATION_PROMPTS = [
  {
    title: 'Harmonic Spiral Vortex',
    desc: 'Lissajous parametric curve with resonance variables',
    prompt: 'Create a Pts.js harmonic spiral vortex with frequency, radius, and line width variables.',
  },
  {
    title: 'Curl Vector Swirl',
    desc: 'Flow field streamlines using trigonometric curl',
    prompt: 'Write a low-level Pts.js curl noise vector field with tension and particle velocity variables.',
  },
  {
    title: 'Cellular Delaunay Tension',
    desc: 'Spring-loaded interconnected node network',
    prompt: 'Write a Pts.js elastic Delaunay triangulation with spring stiffness and link distance variables.',
  },
  {
    title: 'Gravitational Dipole Attractor',
    desc: 'Two celestial gravity wells pulling orbiting tracer points',
    prompt: 'Implement a Pts.js celestial gravity dipole with gravity strength and orbit decay parameters.',
  },
];

export const AiHelpModal: React.FC<AiHelpModalProps> = ({
  isOpen,
  onClose,
  currentCode,
  engine,
  variables,
  onApplyCode,
}) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [suggestedCode, setSuggestedCode] = useState<string | null>(null);
  const [extractedVars, setExtractedVars] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (promptText: string) => {
    if (!promptText.trim()) return;
    setIsLoading(true);
    setError(null);
    setResponse(null);
    setSuggestedCode(null);
    setExtractedVars([]);
    setApplied(false);

    try {
      const res = await fetch('/api/ai-help', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          currentCode,
          engine,
          variables,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Server error occurred');
      }

      const data = await res.json();
      setResponse(data.response);
      setSuggestedCode(data.suggestedCode || null);
      setExtractedVars(data.extractedVariables || []);
    } catch (err: any) {
      setError(err.message || 'Failed to reach AI Assistant.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (suggestedCode) {
      onApplyCode(suggestedCode, extractedVars);
      setApplied(true);
      setTimeout(() => {
        onClose();
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-xs">
      <div
        className="w-full max-w-2xl bg-white border border-zinc-200/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-zinc-200/80 bg-zinc-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-zinc-900 flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-zinc-900 flex items-center gap-1.5">
                <span>AI Creative Architect</span>
                <span className="text-3xs uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
                  Pts.js Assistant
                </span>
              </h2>
              <p className="text-3xs text-zinc-500">
                Synthesize low-level math, Pts.js functions, and new dynamic variables.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Quick Prompts */}
          <div>
            <label className="text-3xs font-semibold uppercase tracking-wider text-zinc-500 block mb-2">
              Quick Suggestions & Archetypes
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {INSPIRATION_PROMPTS.map((item) => (
                <button
                  key={item.title}
                  onClick={() => {
                    setPrompt(item.prompt);
                    handleSubmit(item.prompt);
                  }}
                  className="text-left p-2.5 rounded-xl border border-zinc-200/80 bg-zinc-50/40 hover:bg-zinc-100 hover:border-zinc-300 transition-all group"
                >
                  <div className="text-xs font-medium text-zinc-900 group-hover:text-black flex items-center justify-between">
                    <span>{item.title}</span>
                    <ArrowRight className="w-3 h-3 text-zinc-400 group-hover:text-zinc-700 transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <p className="text-3xs text-zinc-500 mt-0.5">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Prompt Input Box */}
          <div className="space-y-2">
            <label className="text-3xs font-semibold uppercase tracking-wider text-zinc-500 block">
              Describe the function or variable behavior you want
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit(prompt)}
                placeholder="e.g. Generate a ripple shockwave effect with wavelength and damping sliders..."
                className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-zinc-250 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-hidden focus:border-zinc-600 transition-colors"
              />
              <button
                onClick={() => handleSubmit(prompt)}
                disabled={isLoading || !prompt.trim()}
                className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Generate</span>
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
              {error}
            </div>
          )}

          {/* AI Response & Generated Code Preview */}
          {response && (
            <div className="space-y-3 pt-2 border-t border-zinc-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-900 flex items-center gap-1.5">
                  <Code2 className="w-4 h-4 text-zinc-700" />
                  <span>Generated Pts.js Function & Parameters</span>
                </span>

                {suggestedCode && (
                  <button
                    onClick={handleApply}
                    disabled={applied}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-xs ${
                      applied
                        ? 'bg-emerald-600 text-white'
                        : 'bg-zinc-900 hover:bg-black text-white'
                    }`}
                  >
                    {applied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Applied to Editor!</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Apply & Register Variables</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Extracted Variables Chips */}
              {extractedVars.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-3xs uppercase font-mono text-zinc-500">
                    Detected Variables:
                  </span>
                  {extractedVars.map((v: any) => (
                    <span
                      key={v.key}
                      className="px-2 py-0.5 rounded-md text-3xs font-mono bg-zinc-100 text-zinc-800 border border-zinc-200"
                    >
                      {v.name} ({v.type})
                    </span>
                  ))}
                </div>
              )}

              {/* Code display */}
              {suggestedCode ? (
                <pre className="p-3.5 rounded-xl bg-zinc-900 text-zinc-100 font-mono text-xs overflow-x-auto border border-zinc-800 leading-relaxed max-h-56">
                  {suggestedCode}
                </pre>
              ) : (
                <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-700 whitespace-pre-wrap">
                  {response}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-200 bg-zinc-50/50 flex items-center justify-between text-3xs text-zinc-500">
          <span>Powered by Gemini 3.1 & Pts.js Geometry SDK</span>
          <button
            onClick={onClose}
            className="text-zinc-600 hover:text-zinc-900 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
