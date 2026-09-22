import React from 'react';
import { createRoute, useNavigate } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import { ENGINE_PRESETS } from '../engines/presets';
import { EngineType } from '../types';
import {
  Sparkles,
  ArrowRight,
  Sliders,
  Layers,
  Code2,
  CheckCircle2,
  Atom,
  Waves,
  Triangle,
  Flame,
  Globe,
} from 'lucide-react';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/presets',
  component: PresetsGalleryPage,
});

const ENGINE_ICONS: Record<EngineType, React.ReactNode> = {
  particle_swarm: <Atom className="w-5 h-5 text-cyan-600" />,
  harmonic_mesh: <Waves className="w-5 h-5 text-indigo-600" />,
  geometric_delaunay: <Triangle className="w-5 h-5 text-orange-600" />,
  kinetic_ribbons: <Flame className="w-5 h-5 text-rose-600" />,
  cosmic_attractor: <Globe className="w-5 h-5 text-violet-600" />,
};

function PresetsGalleryPage() {
  const navigate = useNavigate();

  const handleSelectPreset = (engineId: EngineType) => {
    // Navigate to studio with selected engine
    navigate({
      to: '/',
      search: (prev: any) => ({
        ...prev,
        engine: engineId,
      }),
    });
  };

  return (
    <div className="h-full w-full overflow-y-auto p-4 sm:p-6 lg:p-8 bg-zinc-50/70">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-zinc-900">
              Pts.js Generative Engines & Presets
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Each visualization engine exposes dynamic mathematical parameters across physics, function, look, and behavior.
            </p>
          </div>
          <span className="self-start sm:self-auto px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-zinc-100 border border-zinc-250 text-zinc-700">
            5 Core Engines Built-in
          </span>
        </div>

        {/* Engine Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(Object.values(ENGINE_PRESETS) as any[]).map((preset) => {
            const engineType = preset.id as EngineType;
            const varsCount = preset.defaultVariables?.length || 0;
            const categories = [
              ...new Set(preset.defaultVariables?.map((v: any) => v.category)),
            ];

            return (
              <div
                key={preset.id}
                className="group relative bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-zinc-350 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-xl bg-zinc-50 border border-zinc-150">
                      {ENGINE_ICONS[engineType] || <Sparkles className="w-5 h-5 text-zinc-600" />}
                    </div>
                    <span className="text-4xs font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">
                      {preset.id}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 group-hover:text-black transition-colors">
                      {preset.name}
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
                      {preset.description}
                    </p>
                  </div>

                  {/* Variable Stats */}
                  <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-3xs font-mono text-zinc-600">
                    <span>{varsCount} dynamic variables</span>
                    <span className="text-zinc-400">
                      {categories.join(' • ')}
                    </span>
                  </div>
                </div>

                {/* Action to Launch into Studio */}
                <button
                  onClick={() => handleSelectPreset(engineType)}
                  className="mt-5 w-full py-2 px-3 rounded-xl bg-zinc-900 hover:bg-black text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs"
                >
                  <span>Launch in Studio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}

          {/* Custom Code Preset Card */}
          <div className="group relative bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-zinc-350 transition-all flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-zinc-50 border border-zinc-150">
                  <Code2 className="w-5 h-5 text-violet-600" />
                </div>
                <span className="text-4xs font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
                  Low-Level Pts.js
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-zinc-900 group-hover:text-black transition-colors">
                  Custom Pts.js Code Kernel
                </h3>
                <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                  Write direct TypeScript/JavaScript functions using Pts.js Space, Form, Pt, Curve, and Geom. Dynamic variables are extracted automatically via comment directives.
                </p>
              </div>

              <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-3xs font-mono text-zinc-600">
                <span>Dynamic `@param` parsing</span>
                <span className="text-violet-600 font-semibold">AI Assistant Ready</span>
              </div>
            </div>

            <button
              onClick={() => {
                navigate({
                  to: '/',
                  search: (prev: any) => ({
                    ...prev,
                    engine: 'custom_code',
                    drawer: 'code',
                  }),
                });
              }}
              className="mt-5 w-full py-2 px-3 rounded-xl bg-zinc-900 hover:bg-black text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs"
            >
              <span>Open in Code Drawer</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
