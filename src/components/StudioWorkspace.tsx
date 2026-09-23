import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Sparkles,
  Dice5,
  Bookmark,
  Download,
  Upload,
  Layers,
  Sliders,
  Eye,
  ChevronDown,
  Code2,
  Bot,
  Atom,
  Waves,
  Triangle,
  Flame,
  Globe,
  Lock,
  Unlock,
  SlidersHorizontal,
} from 'lucide-react';

import {
  DynamicVariable,
  EngineType,
  ParameterCategory,
  RandomizeIntensity,
  SavedConfiguration,
  CanvasLayer,
} from '../types';
import {
  ENGINE_PRESETS,
  randomizeVariables,
  DEFAULT_PRESET_FAVORITES,
} from '../engines/presets';
import { syncLinkedVariables } from '../store/studioStore';
import { VisualizationCanvas } from './VisualizationCanvas';
import { RandomizePanel } from './RandomizePanel';
import { LayersDrawer } from './LayersDrawer';
import { CodeDrawer } from './CodeDrawer';
import { FavoritesModal } from './FavoritesModal';
import { ExportImportModal } from './ExportImportModal';
import { AddVariableModal } from './AddVariableModal';
import { AiHelpModal } from './AiHelpModal';

interface StudioWorkspaceProps {
  initialEngine?: EngineType | 'custom_code';
  initialTab?: 'physics' | 'function' | 'look' | 'behavior' | 'all';
  initialIntensity?: 'gentle' | 'balanced' | 'wild';
  initialDrawer?: 'code' | 'layers' | 'none';
  onUpdateSearch?: (updates: {
    engine?: EngineType | 'custom_code';
    tab?: 'physics' | 'function' | 'look' | 'behavior' | 'all';
    intensity?: 'gentle' | 'balanced' | 'wild';
    drawer?: 'code' | 'layers' | 'none';
  }) => void;
}

const ENGINE_ICONS: Record<EngineType | 'custom_code', React.ReactNode> = {
  particle_swarm: <Atom className="w-4 h-4 text-cyan-600" />,
  harmonic_mesh: <Waves className="w-4 h-4 text-indigo-600" />,
  geometric_delaunay: <Triangle className="w-4 h-4 text-orange-600" />,
  kinetic_ribbons: <Flame className="w-4 h-4 text-rose-600" />,
  cosmic_attractor: <Globe className="w-4 h-4 text-violet-600" />,
  custom_code: <Code2 className="w-4 h-4 text-amber-600" />,
};

export const StudioWorkspace: React.FC<StudioWorkspaceProps> = ({
  initialEngine,
  initialTab,
  initialIntensity,
  initialDrawer,
  onUpdateSearch,
}) => {
  // Layers State: Multi-layer composition
  const [layers, setLayers] = useState<CanvasLayer[]>(() => {
    const engineToUse =
      initialEngine && initialEngine !== 'custom_code' ? initialEngine : 'particle_swarm';
    return [
      {
        id: 'layer-1',
        name: `Layer 1 (${ENGINE_PRESETS[engineToUse].name.split(' ')[0]})`,
        engine: engineToUse,
        variables: JSON.parse(JSON.stringify(ENGINE_PRESETS[engineToUse].defaultVariables)),
        isVisible: true,
        opacity: 1.0,
        blendMode: 'source-over',
        randomizeEnabled: true,
        isLocked: false,
        createdAt: Date.now(),
      },
    ];
  });

  const [activeLayerId, setActiveLayerId] = useState<string>('layer-1');

  // Currently active layer helper
  const activeLayer = useMemo(() => {
    return layers.find((l) => l.id === activeLayerId) || layers[0] || null;
  }, [layers, activeLayerId]);

  // Active layer's variables
  const activeVariables = useMemo(() => {
    return activeLayer ? activeLayer.variables : [];
  }, [activeLayer]);

  // Code editor state
  const [activeCode, setActiveCode] = useState<string>(
    activeLayer?.customCode ||
      `// Pts.js Custom Canvas Function\nfunction render(form, space, time, v, pointer) {\n  const center = space.center;\n  const r = (v.radius || 60) + Math.sin(time * 2) * 10;\n  form.stroke("#00f0ff", 2).circle(Circle.fromCenter(center, r));\n}`
  );
  const [executionError, setExecutionError] = useState<string | null>(null);

  // Drawers State
  const [isCodeDrawerOpen, setIsCodeDrawerOpen] = useState(initialDrawer === 'code');
  const [isLayersDrawerOpen, setIsLayersDrawerOpen] = useState(initialDrawer === 'layers');

  // Randomize intensity (Variance Selector)
  const [intensity, setIntensity] = useState<RandomizeIntensity>(initialIntensity || 'balanced');
  const [isRandomizing, setIsRandomizing] = useState<boolean>(false);

  // Modals state
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [exportImportModal, setExportImportModal] = useState<{
    isOpen: boolean;
    tab: 'export' | 'import';
  }>({
    isOpen: false,
    tab: 'export',
  });
  const [isAddVariableOpen, setIsAddVariableOpen] = useState(false);
  const [addVarCategory, setAddVarCategory] = useState<ParameterCategory>('physics');
  const [isAiHelpOpen, setIsAiHelpOpen] = useState(false);

  // Saved Favorites
  const [favorites, setFavorites] = useState<SavedConfiguration[]>(() => {
    try {
      const stored = localStorage.getItem('pts_randomizer_favorites');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to load favorites', e);
    }
    return DEFAULT_PRESET_FAVORITES.map((fav) => ({
      ...fav,
      variables: JSON.parse(
        JSON.stringify(ENGINE_PRESETS[fav.engine as EngineType]?.defaultVariables || [])
      ),
    }));
  });

  useEffect(() => {
    try {
      localStorage.setItem('pts_randomizer_favorites', JSON.stringify(favorites));
    } catch (e) {
      console.error('Failed to persist favorites', e);
    }
  }, [favorites]);

  // Toast Notification
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'success' | 'amber' } | null>(
    null
  );
  const showToast = useCallback(
    (message: string, type: 'info' | 'success' | 'amber' = 'info') => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 3000);
    },
    []
  );

  // Mobile view tab toggle: 'preview' or 'controls'
  const [mobileTab, setMobileTab] = useState<'preview' | 'controls'>('preview');

  // Engine Switcher for Active Layer
  const handleEngineChange = (newEngine: EngineType | 'custom_code') => {
    if (!activeLayer) return;
    if (newEngine === 'custom_code') {
      setLayers((prev) =>
        prev.map((l) => {
          if (l.id !== activeLayerId) return l;
          return {
            ...l,
            engine: 'custom_code',
            customCode: activeCode,
            name: `${l.name} (Code)`,
          };
        })
      );
      setIsCodeDrawerOpen(true);
      onUpdateSearch?.({ engine: 'custom_code', drawer: 'code' });
      showToast('Switched active layer to Custom Pts.js Code', 'info');
      return;
    }

    const freshVars = JSON.parse(JSON.stringify(ENGINE_PRESETS[newEngine].defaultVariables));
    setLayers((prev) =>
      prev.map((l) => {
        if (l.id !== activeLayerId) return l;
        return {
          ...l,
          engine: newEngine,
          variables: freshVars,
          name: `${ENGINE_PRESETS[newEngine].name} Layer`,
        };
      })
    );
    onUpdateSearch?.({ engine: newEngine });
    showToast(`Switched active layer to ${ENGINE_PRESETS[newEngine].name}`, 'info');
  };

  // Variable updater for active layer with attribute linking propagation
  const handleUpdateVariable = useCallback(
    (id: string, updates: Partial<DynamicVariable>) => {
      if (activeLayer?.isLocked) {
        showToast('Active layer is locked in', 'amber');
        return;
      }
      setLayers((prev) => {
        const updatedLayers = prev.map((l) => {
          if (l.id !== activeLayerId) return l;
          return {
            ...l,
            variables: l.variables.map((v) => (v.id === id ? { ...v, ...updates } : v)),
          };
        });

        // Propagate linked attribute values to any other layers tied to this variable
        if (updates.value !== undefined) {
          return syncLinkedVariables(updatedLayers, activeLayerId, id, updates.value);
        }
        return updatedLayers;
      });
    },
    [activeLayer, activeLayerId, showToast]
  );

  // Master Randomize: Randomizes unlocked variables and synchronizes tied attributes
  const handleRandomizeAll = useCallback(() => {
    setIsRandomizing(true);
    setTimeout(() => {
      let totalChangedCount = 0;
      let affectedLayersCount = 0;
      let skippedLayersCount = 0;

      setLayers((prevLayers) => {
        // Step 1: Randomize eligible layers
        const randomizedLayers = prevLayers.map((layer) => {
          if (!layer.randomizeEnabled || layer.isLocked) {
            skippedLayersCount++;
            return layer;
          }

          affectedLayersCount++;
          const { updated, changedCount } = randomizeVariables(layer.variables, intensity);
          totalChangedCount += changedCount;
          return {
            ...layer,
            variables: updated,
          };
        });

        // Step 2: Synchronize all tied attributes across layers
        return randomizedLayers.map((layer) => {
          const syncedVars = layer.variables.map((v) => {
            if (v.linkedTo) {
              const driverLayer = randomizedLayers.find((dl) => dl.id === v.linkedTo?.targetLayerId);
              const driverVar = driverLayer?.variables.find((dv) => dv.id === v.linkedTo?.targetVarId);
              if (driverVar) {
                let syncedVal = driverVar.value;
                if (typeof syncedVal === 'number') {
                  const mult = v.linkedTo.multiplier ?? 1.0;
                  syncedVal = Number((syncedVal * mult).toFixed(2));
                  if (v.min !== undefined) syncedVal = Math.max(v.min, syncedVal);
                  if (v.max !== undefined) syncedVal = Math.min(v.max, syncedVal);
                }
                return { ...v, value: syncedVal };
              }
            }
            return v;
          });
          return { ...layer, variables: syncedVars };
        });
      });

      if (totalChangedCount > 0) {
        showToast(
          `Randomized ${totalChangedCount} variables across ${affectedLayersCount} active layer${
            affectedLayersCount === 1 ? '' : 's'
          }${skippedLayersCount > 0 ? ` (${skippedLayersCount} locked/protected)` : ''}`,
          'success'
        );
      } else {
        showToast('No unlocked variables available to randomize', 'amber');
      }

      setIsRandomizing(false);
    }, 150);
  }, [intensity, showToast]);

  // Randomize Category Only on Active Layer
  const handleRandomizeCategory = useCallback(
    (cat: ParameterCategory) => {
      if (activeLayer?.isLocked) {
        showToast('Active layer is locked in', 'amber');
        return;
      }
      setLayers((prev) =>
        prev.map((l) => {
          if (l.id !== activeLayerId) return l;
          const { updated, changedCount } = randomizeVariables(l.variables, intensity, cat);
          showToast(`Randomized ${changedCount} variables in ${cat}`, 'success');
          return { ...l, variables: updated };
        })
      );
    },
    [activeLayer, activeLayerId, intensity, showToast]
  );

  // Master Lock / Unlock All for Active Layer
  const handleLockAll = useCallback(
    (locked: boolean) => {
      if (activeLayer?.isLocked) {
        showToast('Active layer is locked in', 'amber');
        return;
      }
      setLayers((prev) =>
        prev.map((l) => {
          if (l.id !== activeLayerId) return l;
          return {
            ...l,
            variables: l.variables.map((v) => ({ ...v, isLocked: locked })),
          };
        })
      );
      showToast(
        locked ? 'Locked all variables on active layer' : 'Unlocked all variables on active layer',
        locked ? 'amber' : 'info'
      );
    },
    [activeLayer, activeLayerId, showToast]
  );

  // Invert Locks for Active Layer
  const handleInvertLocks = useCallback(() => {
    if (activeLayer?.isLocked) {
      showToast('Active layer is locked in', 'amber');
      return;
    }
    setLayers((prev) =>
      prev.map((l) => {
        if (l.id !== activeLayerId) return l;
        return {
          ...l,
          variables: l.variables.map((v) => ({ ...v, isLocked: !v.isLocked })),
        };
      })
    );
    showToast('Inverted lock states on active layer', 'info');
  }, [activeLayer, activeLayerId, showToast]);

  // Add Dynamic Variable to Active Layer
  const handleAddDynamicVariable = useCallback(
    (newVar: DynamicVariable) => {
      if (activeLayer?.isLocked) {
        showToast('Active layer is locked in', 'amber');
        return;
      }
      setLayers((prev) =>
        prev.map((l) => {
          if (l.id !== activeLayerId) return l;
          return {
            ...l,
            variables: [...l.variables, newVar],
          };
        })
      );
      showToast(`Added dynamic variable: "${newVar.name}"`, 'success');
    },
    [activeLayer, activeLayerId, showToast]
  );

  // Remove Dynamic Variable from Active Layer
  const handleRemoveDynamicVariable = useCallback(
    (id: string) => {
      if (activeLayer?.isLocked) {
        showToast('Active layer is locked in', 'amber');
        return;
      }
      setLayers((prev) =>
        prev.map((l) => {
          if (l.id !== activeLayerId) return l;
          return {
            ...l,
            variables: l.variables.filter((v) => v.id !== id),
          };
        })
      );
      showToast('Removed custom variable', 'info');
    },
    [activeLayer, activeLayerId, showToast]
  );

  // Layer Management Handlers
  const handleAddLayer = (engine: EngineType | 'custom_code', name?: string) => {
    const newId = `layer-${Date.now()}`;
    const layerName =
      name ||
      (engine === 'custom_code'
        ? `Layer ${layers.length + 1} (Code)`
        : `Layer ${layers.length + 1} (${ENGINE_PRESETS[engine]?.name.split(' ')[0]})`);

    const initialVars =
      engine !== 'custom_code'
        ? JSON.parse(JSON.stringify(ENGINE_PRESETS[engine].defaultVariables))
        : JSON.parse(JSON.stringify(ENGINE_PRESETS.particle_swarm.defaultVariables));

    const newLayer: CanvasLayer = {
      id: newId,
      name: layerName,
      engine,
      customCode: engine === 'custom_code' ? activeCode : undefined,
      variables: initialVars,
      isVisible: true,
      opacity: 0.9,
      blendMode: layers.length > 0 ? 'screen' : 'source-over',
      randomizeEnabled: true,
      isLocked: false,
      createdAt: Date.now(),
    };

    setLayers((prev) => [...prev, newLayer]);
    setActiveLayerId(newId);
    showToast(`Added ${layerName}`, 'success');
  };

  const handleUpdateLayer = (layerId: string, updates: Partial<CanvasLayer>) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === layerId ? { ...l, ...updates } : l))
    );
  };

  const handleDuplicateLayer = (layerId: string) => {
    const source = layers.find((l) => l.id === layerId);
    if (!source) return;

    const dupId = `layer-${Date.now()}`;
    const duplicated: CanvasLayer = {
      ...JSON.parse(JSON.stringify(source)),
      id: dupId,
      name: `${source.name} (Copy)`,
      createdAt: Date.now(),
    };

    setLayers((prev) => [...prev, duplicated]);
    setActiveLayerId(dupId);
    showToast(`Duplicated ${source.name}`, 'success');
  };

  const handleDeleteLayer = (layerId: string) => {
    if (layers.length <= 1) {
      showToast('Cannot delete the last remaining layer', 'amber');
      return;
    }
    const target = layers.find((l) => l.id === layerId);
    const newLayers = layers.filter((l) => l.id !== layerId);
    setLayers(newLayers);
    if (activeLayerId === layerId) {
      setActiveLayerId(newLayers[0]?.id || '');
    }
    showToast(`Deleted layer "${target?.name || ''}"`, 'info');
  };

  const handleReorderLayer = (layerId: string, direction: 'up' | 'down') => {
    const index = layers.findIndex((l) => l.id === layerId);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === layers.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const newLayers = [...layers];
    const [moved] = newLayers.splice(index, 1);
    newLayers.splice(targetIndex, 0, moved);
    setLayers(newLayers);
  };

  const handleRandomizeSingleLayer = (layerId: string) => {
    setLayers((prev) =>
      prev.map((l) => {
        if (l.id !== layerId) return l;
        if (l.isLocked) {
          showToast(`Layer "${l.name}" is locked in`, 'amber');
          return l;
        }
        const { updated, changedCount } = randomizeVariables(l.variables, intensity);
        showToast(`Randomized ${changedCount} variables in "${l.name}"`, 'success');
        return { ...l, variables: updated };
      })
    );
  };

  // Run and sync code from CodeDrawer
  const handleRunAndSyncCode = (code: string) => {
    setActiveCode(code);
    if (activeLayer) {
      setLayers((prev) =>
        prev.map((l) => {
          if (l.id !== activeLayerId) return l;
          return {
            ...l,
            engine: 'custom_code',
            customCode: code,
          };
        })
      );
    }
    setExecutionError(null);
    showToast('Applied Pts.js code to active layer', 'success');
  };

  // Keyboard Shortcuts Listener (Space / R for randomize)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        activeEl?.tagName === 'SELECT' ||
        (activeEl as HTMLElement)?.isContentEditable;

      if (isInput) return;

      if (e.code === 'Space' || e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleRandomizeAll();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRandomizeAll]);

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Top Header Bar: Prominent Module Switcher, Variance Selector, Randomized Parameters Bar, Layers in Right Corner */}
      <div className="px-4 py-2.5 bg-white/95 border-b border-zinc-200/90 z-10 shrink-0 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        {/* Left: Prominent Module View Switcher */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 p-1.5 pl-2.5 pr-2 bg-zinc-100/90 hover:bg-zinc-200/80 rounded-xl border border-zinc-250 transition-all shadow-2xs">
            <span className="shrink-0">
              {ENGINE_ICONS[activeLayer?.engine || 'particle_swarm']}
            </span>
            <div className="flex flex-col">
              <span className="text-4xs font-mono font-bold uppercase tracking-wider text-zinc-400 leading-none">
                MODULE / ENGINE
              </span>
              <div className="relative">
                <select
                  id="select-visualization-engine"
                  value={activeLayer?.engine || 'particle_swarm'}
                  onChange={(e) =>
                    handleEngineChange(e.target.value as EngineType | 'custom_code')
                  }
                  className="appearance-none bg-transparent pr-6 py-0.5 text-xs font-bold text-zinc-900 cursor-pointer focus:outline-hidden"
                >
                  {(Object.values(ENGINE_PRESETS) as any[]).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                  <option value="custom_code">Custom Pts.js Code Kernel</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Active Layer Pill */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-50 border border-zinc-200 text-3xs font-mono">
            <span className="w-2 h-2 rounded-full bg-zinc-900"></span>
            <span className="text-zinc-500 font-semibold">Active Layer:</span>
            <strong className="text-zinc-900 truncate max-w-[120px]">
              {activeLayer?.name}
            </strong>
            {activeLayer?.isLocked && (
              <span className="px-1 py-0.2 rounded text-4xs bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-0.5">
                <Lock className="w-2.5 h-2.5" />
                <span>Locked</span>
              </span>
            )}
          </div>
        </div>

        {/* Center: Variance Selector + Master Randomize Parameters Bar */}
        <div className="flex items-center gap-2">
          {/* Variance Selector (Gentle, Balanced, Wild) */}
          <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl border border-zinc-250">
            <span className="text-4xs font-mono font-bold uppercase text-zinc-400 px-1.5 hidden sm:inline">
              Variance:
            </span>
            {(['gentle', 'balanced', 'wild'] as RandomizeIntensity[]).map((lvl) => (
              <button
                key={lvl}
                onClick={() => {
                  setIntensity(lvl);
                  onUpdateSearch?.({ intensity: lvl });
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition-all ${
                  intensity === lvl
                    ? 'bg-white text-zinc-900 shadow-2xs font-extrabold ring-1 ring-zinc-300'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          {/* Master Randomized Parameters Bar Button */}
          <button
            id="btn-master-randomize-header"
            onClick={handleRandomizeAll}
            disabled={isRandomizing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-black text-white text-xs font-bold tracking-wide transition-all shadow-md hover:scale-[1.02] active:scale-[0.98]"
            title="Randomize unlocked parameters across all active layers (Shortcut: Space or R)"
          >
            <Dice5 className={`w-4 h-4 ${isRandomizing ? 'animate-spin' : ''}`} />
            <span>Randomize Parameters</span>
            <span className="hidden md:inline px-1.5 py-0.2 rounded bg-white/20 text-white text-4xs font-mono">
              Space / R
            </span>
          </button>
        </div>

        {/* Right Corner: Code Drawer Toggle & Prominent Layers Button in Right Corner */}
        <div className="flex items-center gap-2">
          {/* Code Drawer Toggle */}
          <button
            id="btn-open-code-drawer"
            onClick={() => {
              const next = !isCodeDrawerOpen;
              setIsCodeDrawerOpen(next);
              onUpdateSearch?.({ drawer: next ? 'code' : 'none' });
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all shadow-2xs ${
              isCodeDrawerOpen
                ? 'bg-violet-600 text-white border-violet-600 shadow-violet-500/20'
                : 'bg-white hover:bg-zinc-50 text-zinc-700 border-zinc-250'
            }`}
            title="Toggle Pts.js Code Drawer with .tsx files"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">PTS Code</span>
          </button>

          {/* AI Help */}
          <button
            id="btn-ai-help"
            onClick={() => setIsAiHelpOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-zinc-50 border border-zinc-250 text-zinc-800 text-xs font-semibold transition-all shadow-2xs"
            title="AI Pts.js mathematical generator"
          >
            <Bot className="w-3.5 h-3.5 text-zinc-600" />
            <span className="hidden xl:inline">AI Help</span>
          </button>

          {/* Layers Button in Far Right Corner */}
          <button
            id="btn-open-layers-drawer"
            onClick={() => {
              const next = !isLayersDrawerOpen;
              setIsLayersDrawerOpen(next);
              onUpdateSearch?.({ drawer: next ? 'layers' : 'none' });
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-xs ${
              isLayersDrawerOpen
                ? 'bg-zinc-900 text-white border-zinc-900'
                : 'bg-zinc-900 hover:bg-black text-white border-zinc-900'
            }`}
            title="Toggle multi-layer slide-out drawer in right corner"
          >
            <Layers className="w-4 h-4 text-zinc-200" />
            <span>Layers</span>
            <span className="px-1.5 py-0.2 rounded-full text-3xs font-mono bg-white/20 text-white">
              {layers.length}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Tab Bar */}
      <div className="lg:hidden flex items-center justify-around border-b border-zinc-200 bg-white p-1">
        <button
          onClick={() => setMobileTab('preview')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg text-center transition-all ${
            mobileTab === 'preview'
              ? 'bg-zinc-900 text-white shadow-xs'
              : 'text-zinc-600 hover:text-zinc-900'
          }`}
        >
          <Eye className="w-3.5 h-3.5 inline mr-1" />
          Preview
        </button>
        <button
          onClick={() => setMobileTab('controls')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg text-center transition-all ${
            mobileTab === 'controls'
              ? 'bg-zinc-900 text-white shadow-xs'
              : 'text-zinc-600 hover:text-zinc-900'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 inline mr-1" />
          Sliders ({activeVariables.length})
        </button>
      </div>

      {/* Main Studio Split Layout */}
      <main className="flex-1 flex overflow-hidden p-2 sm:p-3 gap-3">
        {/* Left Section: Live Visualization Preview */}
        <section
          id="preview-section"
          className={`h-full flex-col transition-all duration-300 relative ${
            mobileTab === 'preview' ? 'flex flex-1' : 'hidden lg:flex lg:flex-1'
          }`}
          style={{ minWidth: 0 }}
        >
          <VisualizationCanvas
            layers={layers}
            activeLayerId={activeLayerId}
            onQuickRandomize={handleRandomizeAll}
            isRandomizing={isRandomizing}
            onToggleCodeDrawer={() => {
              const next = !isCodeDrawerOpen;
              setIsCodeDrawerOpen(next);
              onUpdateSearch?.({ drawer: next ? 'code' : 'none' });
            }}
            isCodeDrawerOpen={isCodeDrawerOpen}
            onToggleLayersDrawer={() => {
              const next = !isLayersDrawerOpen;
              setIsLayersDrawerOpen(next);
              onUpdateSearch?.({ drawer: next ? 'layers' : 'none' });
            }}
            isLayersDrawerOpen={isLayersDrawerOpen}
          >
            {/* 1. Left Slide-out Code Drawer */}
            <CodeDrawer
              isOpen={isCodeDrawerOpen}
              onClose={() => {
                setIsCodeDrawerOpen(false);
                onUpdateSearch?.({ drawer: 'none' });
              }}
              code={activeCode}
              onChangeCode={setActiveCode}
              onRunAndSync={handleRunAndSyncCode}
              variables={activeVariables}
              onOpenAiHelp={() => setIsAiHelpOpen(true)}
              executionError={executionError}
            />

            {/* 2. Right Slide-out Layers Drawer */}
            <LayersDrawer
              isOpen={isLayersDrawerOpen}
              onClose={() => {
                setIsLayersDrawerOpen(false);
                onUpdateSearch?.({ drawer: 'none' });
              }}
              layers={layers}
              activeLayerId={activeLayerId}
              onSelectLayer={(id) => setActiveLayerId(id)}
              onAddLayer={handleAddLayer}
              onUpdateLayer={handleUpdateLayer}
              onDuplicateLayer={handleDuplicateLayer}
              onDeleteLayer={handleDeleteLayer}
              onReorderLayer={handleReorderLayer}
              onRandomizeLayer={handleRandomizeSingleLayer}
              onRandomizeAllEligible={handleRandomizeAll}
            />
          </VisualizationCanvas>
        </section>

        {/* Right Section: Expanded Tabbed Parameter Sliders with Color-coded Tabs & Coral Orange Button */}
        <aside
          id="randomize-section"
          className={`h-full flex-col transition-all duration-300 ${
            mobileTab === 'controls'
              ? 'flex flex-1'
              : 'hidden lg:flex w-[440px] xl:w-[500px] shrink-0'
          }`}
          style={{ minWidth: 0 }}
        >
          <RandomizePanel
            variables={activeVariables}
            allLayers={layers}
            activeLayerId={activeLayerId}
            onUpdateVariable={handleUpdateVariable}
            onRandomizeCategory={handleRandomizeCategory}
            onLockAll={handleLockAll}
            onInvertLocks={handleInvertLocks}
            onAddVariableClick={(cat) => {
              if (cat) setAddVarCategory(cat);
              setIsAddVariableOpen(true);
            }}
            onRemoveVariable={handleRemoveDynamicVariable}
            intensity={intensity}
            activeLayerName={activeLayer?.name || 'Active Layer'}
            activeLayerIsLocked={activeLayer?.isLocked || false}
            activeLayerRandomizeEnabled={activeLayer?.randomizeEnabled !== false}
          />
        </aside>
      </main>

      {/* Favorites Modal */}
      <FavoritesModal
        isOpen={isFavoritesOpen}
        onClose={() => setIsFavoritesOpen(false)}
        favorites={favorites}
        onLoadFavorite={(config) => {
          if (activeLayer) {
            setLayers((prev) =>
              prev.map((l) => {
                if (l.id !== activeLayerId) return l;
                return {
                  ...l,
                  engine: config.engine,
                  variables: JSON.parse(JSON.stringify(config.variables)),
                  name: config.name,
                };
              })
            );
          }
          showToast(`Loaded favorite "${config.name}"`, 'success');
        }}
        onSaveCurrentAsFavorite={(name, notes) => {
          if (!activeLayer) return;
          const newFav: SavedConfiguration = {
            id: `fav-${Date.now()}`,
            name,
            createdAt: Date.now(),
            engine:
              activeLayer.engine === 'custom_code' ? 'particle_swarm' : activeLayer.engine,
            variables: JSON.parse(JSON.stringify(activeLayer.variables)),
            previewPalette: ['#00f0ff', '#ff0077', '#090a0f'],
            tags: [activeLayer.name.split(' ')[0]],
            notes,
          };
          setFavorites((prev) => [newFav, ...prev]);
          showToast(`Saved favorite: "${name}"`, 'success');
        }}
        onDeleteFavorite={(id) => {
          setFavorites((prev) => prev.filter((f) => f.id !== id));
          showToast('Deleted favorite configuration', 'info');
        }}
        currentEngine={
          activeLayer?.engine === 'custom_code'
            ? 'particle_swarm'
            : activeLayer?.engine || 'particle_swarm'
        }
        currentVariables={activeVariables}
      />

      {/* Export / Import Modal */}
      <ExportImportModal
        isOpen={exportImportModal.isOpen}
        onClose={() => setExportImportModal({ isOpen: false, tab: 'export' })}
        activeTab={exportImportModal.tab}
        engine={
          activeLayer?.engine === 'custom_code'
            ? 'particle_swarm'
            : activeLayer?.engine || 'particle_swarm'
        }
        variables={activeVariables}
        onImportConfig={(data) => {
          if (activeLayer) {
            setLayers((prev) =>
              prev.map((l) => {
                if (l.id !== activeLayerId) return l;
                return {
                  ...l,
                  engine: data.engine,
                  variables: JSON.parse(JSON.stringify(data.variables)),
                  name: data.name || `${ENGINE_PRESETS[data.engine]?.name} Layer`,
                };
              })
            );
          }
          showToast(`Imported project "${data.name || ''}"`, 'success');
        }}
      />

      {/* Add Custom Variable Modal */}
      <AddVariableModal
        isOpen={isAddVariableOpen}
        onClose={() => setIsAddVariableOpen(false)}
        onAdd={handleAddDynamicVariable}
        initialCategory={addVarCategory}
      />

      {/* AI Help Modal */}
      <AiHelpModal
        isOpen={isAiHelpOpen}
        onClose={() => setIsAiHelpOpen(false)}
        currentCode={activeCode}
        engine={
          activeLayer?.engine === 'custom_code'
            ? 'particle_swarm'
            : activeLayer?.engine || 'particle_swarm'
        }
        variables={activeVariables}
        onApplyCode={(code, newVars) => {
          setActiveCode(code);
          if (activeLayer) {
            setLayers((prev) =>
              prev.map((l) => {
                if (l.id !== activeLayerId) return l;
                return {
                  ...l,
                  engine: 'custom_code',
                  customCode: code,
                  variables: newVars && newVars.length > 0 ? newVars : l.variables,
                  name: `${l.name} (AI Generated)`,
                };
              })
            );
          }
          setIsCodeDrawerOpen(true);
          showToast('Applied AI-generated visualization code and parameters', 'success');
        }}
      />

      {/* Toast Notification */}
      {toast && (
        <div
          id="app-toast-notification"
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl border backdrop-blur-md shadow-xl text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200 ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : toast.type === 'amber'
              ? 'bg-amber-50 border-amber-300 text-amber-900'
              : 'bg-zinc-900 border-zinc-800 text-white'
          }`}
        >
          <Sparkles className="w-4 h-4 shrink-0 text-current" />
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
};
