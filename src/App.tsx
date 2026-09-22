/**
 * Pts.js Visualization Randomizer
 * Studio Atelier - Gallery White Aesthetic
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Sparkles,
  Dice5,
  Bookmark,
  Download,
  Upload,
  Layers,
  RotateCcw,
  Sliders,
  Eye,
  Settings,
  HelpCircle,
  ExternalLink,
  ChevronDown,
  Lock,
  Unlock,
  Code2,
  Bot,
} from 'lucide-react';

import {
  DynamicVariable,
  EngineType,
  ParameterCategory,
  RandomizeIntensity,
  SavedConfiguration,
  CanvasLayer,
} from './types';
import {
  ENGINE_PRESETS,
  randomizeVariables,
  DEFAULT_PRESET_FAVORITES,
  COLOR_PALETTES,
} from './engines/presets';
import { VisualizationCanvas } from './components/VisualizationCanvas';
import { RandomizePanel } from './components/RandomizePanel';
import { LayersDrawer } from './components/LayersDrawer';
import { CodeDrawer } from './components/CodeDrawer';
import { FavoritesModal } from './components/FavoritesModal';
import { ExportImportModal } from './components/ExportImportModal';
import { AddVariableModal } from './components/AddVariableModal';
import { AiHelpModal } from './components/AiHelpModal';

export default function App() {
  // Layers State: Multi-layer composition
  const [layers, setLayers] = useState<CanvasLayer[]>(() => [
    {
      id: 'layer-1',
      name: 'Layer 1 (Particle Swarm)',
      engine: 'particle_swarm',
      variables: JSON.parse(JSON.stringify(ENGINE_PRESETS.particle_swarm.defaultVariables)),
      isVisible: true,
      opacity: 1.0,
      blendMode: 'source-over',
      randomizeEnabled: true,
      isLocked: false,
      createdAt: Date.now(),
    },
  ]);

  const [activeLayerId, setActiveLayerId] = useState<string>('layer-1');

  // Currently active layer helper
  const activeLayer = useMemo(() => {
    return layers.find((l) => l.id === activeLayerId) || layers[0] || null;
  }, [layers, activeLayerId]);

  // Active layer's variables
  const activeVariables = useMemo(() => {
    return activeLayer ? activeLayer.variables : [];
  }, [activeLayer]);

  // Code editor state for custom code execution
  const [activeCode, setActiveCode] = useState<string>(
    activeLayer?.customCode ||
      `// Pts.js Custom Canvas Function
// Accessible objects: form, space, time, v, pointer, isMouseDown, Pt, Group, Curve, Geom, Circle, Triangle, Polygon

function render(form, space, time, v, pointer, isMouseDown) {
  const center = space.center;
  const numRings = Math.round(v.numRings || 6);
  const baseRadius = v.baseRadius || 60;
  const spiralTwist = v.spiralTwist || 2.4;
  const primaryColor = v.primaryColor || '#00f0ff';
  const secondaryColor = v.secondaryColor || '#ff0077';
  
  for (let i = 1; i <= numRings; i++) {
    const r = baseRadius * i * 0.4 + Math.sin(time * 2 + i) * 12;
    const count = 12 + i * 4;
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
}`
  );
  const [executionError, setExecutionError] = useState<string | null>(null);

  // Drawers State: Sliding out into visualization frame
  const [isCodeDrawerOpen, setIsCodeDrawerOpen] = useState(false);
  const [isLayersDrawerOpen, setIsLayersDrawerOpen] = useState(false);

  // Randomize intensity setting
  const [intensity, setIntensity] = useState<RandomizeIntensity>('balanced');
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

  // Saved Favorites in LocalStorage
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

  // Save favorites to LocalStorage whenever updated
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
      showToast('Switched layer to Custom Pts.js Code mode', 'info');
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
    showToast(`Switched active layer to ${ENGINE_PRESETS[newEngine].name}`, 'info');
  };

  // Variable updater for active layer
  const handleUpdateVariable = useCallback(
    (id: string, updates: Partial<DynamicVariable>) => {
      if (activeLayer?.isLocked) {
        showToast('Active layer is locked in', 'amber');
        return;
      }
      setLayers((prev) =>
        prev.map((l) => {
          if (l.id !== activeLayerId) return l;
          return {
            ...l,
            variables: l.variables.map((v) => (v.id === id ? { ...v, ...updates } : v)),
          };
        })
      );
    },
    [activeLayer, activeLayerId, showToast]
  );

  // Master Randomize: Only affects layers where randomizeEnabled === true AND isLocked === false!
  const handleRandomizeAll = useCallback(() => {
    setIsRandomizing(true);
    setTimeout(() => {
      let totalChangedCount = 0;
      let affectedLayersCount = 0;
      let skippedLayersCount = 0;

      setLayers((prevLayers) => {
        return prevLayers.map((layer) => {
          // Check if randomize effects this layer AND layer is not locked in
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
      });

      if (totalChangedCount > 0) {
        showToast(
          `Randomized ${totalChangedCount} variables across ${affectedLayersCount} active layer${
            affectedLayersCount === 1 ? '' : 's'
          }${skippedLayersCount > 0 ? ` (${skippedLayersCount} protected/locked)` : ''}`,
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

    let initialVars: DynamicVariable[] = [];
    if (engine !== 'custom_code') {
      initialVars = JSON.parse(JSON.stringify(ENGINE_PRESETS[engine].defaultVariables));
    } else {
      initialVars = [
        {
          id: `var-${Date.now()}-1`,
          name: 'Num Rings',
          key: 'numRings',
          category: 'function',
          type: 'number',
          value: 6,
          defaultValue: 6,
          min: 1,
          max: 16,
          step: 1,
          isLocked: false,
        },
        {
          id: `var-${Date.now()}-2`,
          name: 'Base Radius',
          key: 'baseRadius',
          category: 'physics',
          type: 'number',
          value: 60,
          defaultValue: 60,
          min: 20,
          max: 180,
          step: 1,
          isLocked: false,
        },
        {
          id: `var-${Date.now()}-3`,
          name: 'Spiral Twist',
          key: 'spiralTwist',
          category: 'behavior',
          type: 'number',
          value: 2.4,
          defaultValue: 2.4,
          min: 0.1,
          max: 6.0,
          step: 0.1,
          isLocked: false,
        },
        {
          id: `var-${Date.now()}-4`,
          name: 'Primary Color',
          key: 'primaryColor',
          category: 'look',
          type: 'color',
          value: '#00f0ff',
          defaultValue: '#00f0ff',
          isLocked: false,
        },
        {
          id: `var-${Date.now()}-5`,
          name: 'Secondary Color',
          key: 'secondaryColor',
          category: 'look',
          type: 'color',
          value: '#ff0077',
          defaultValue: '#ff0077',
          isLocked: false,
        },
      ];
    }

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
    showToast('Applied Pts.js custom code to layer', 'success');
  };

  // Save Current Active Layer as Favorite
  const handleSaveCurrentFavorite = useCallback(
    (name: string, notes?: string) => {
      if (!activeLayer) return;
      const currentVarsMap: Record<string, any> = {};
      activeLayer.variables.forEach((v) => {
        currentVarsMap[v.key] = v.value;
      });

      const previewPalette = [
        currentVarsMap.primaryColor || '#00f0ff',
        currentVarsMap.secondaryColor || '#ff0077',
        currentVarsMap.bgColor || '#090a0f',
      ];

      const newFavorite: SavedConfiguration = {
        id: `fav-${Date.now()}`,
        name,
        createdAt: Date.now(),
        engine: activeLayer.engine === 'custom_code' ? 'particle_swarm' : activeLayer.engine,
        variables: JSON.parse(JSON.stringify(activeLayer.variables)),
        previewPalette,
        tags: [activeLayer.name.split(' ')[0]],
        notes,
      };

      setFavorites((prev) => [newFavorite, ...prev]);
      showToast(`Saved favorite: "${name}"`, 'success');
    },
    [activeLayer, showToast]
  );

  // Load a Saved Favorite
  const handleLoadFavorite = useCallback(
    (config: SavedConfiguration) => {
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
      showToast(`Loaded favorite "${config.name}" into active layer`, 'success');
    },
    [activeLayer, activeLayerId, showToast]
  );

  // Delete a Favorite
  const handleDeleteFavorite = useCallback(
    (id: string) => {
      setFavorites((prev) => prev.filter((f) => f.id !== id));
      showToast('Deleted favorite configuration', 'info');
    },
    [showToast]
  );

  // Import project configuration
  const handleImportConfig = useCallback(
    (data: { engine: EngineType; variables: DynamicVariable[]; name?: string }) => {
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
      showToast(
        `Successfully imported project${data.name ? ` "${data.name}"` : ''}!`,
        'success'
      );
    },
    [activeLayer, activeLayerId, showToast]
  );

  // Reset Active Layer to Factory Defaults
  const handleResetToDefaults = () => {
    if (!activeLayer) return;
    if (activeLayer.engine !== 'custom_code') {
      const fresh = JSON.parse(
        JSON.stringify(ENGINE_PRESETS[activeLayer.engine].defaultVariables)
      );
      setLayers((prev) =>
        prev.map((l) => (l.id === activeLayerId ? { ...l, variables: fresh } : l))
      );
      showToast(`Reset ${ENGINE_PRESETS[activeLayer.engine].name} to default values`, 'info');
    }
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
    <div className="flex flex-col h-screen w-screen bg-zinc-100/90 text-zinc-900 overflow-hidden font-sans select-none antialiased">
      {/* Top Application Navbar: Gallery White Atelier */}
      <header
        id="app-header"
        className="flex items-center justify-between px-4 py-2.5 bg-white/95 backdrop-blur-md border-b border-zinc-200/90 z-20 shrink-0 shadow-2xs"
      >
        <div className="flex items-center gap-3">
          {/* Logo & Title */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-zinc-900 flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-zinc-900 flex items-center gap-1.5">
                <span>Pts.js Randomizer</span>
                <span className="px-1.5 py-0.2 rounded text-4xs font-mono font-medium uppercase bg-zinc-100 text-zinc-700 border border-zinc-250">
                  Studio Atelier
                </span>
              </h1>
              <p className="text-4xs text-zinc-500 hidden sm:block">
                Dynamic Parameter Randomization & Multi-Layer Generative Canvas
              </p>
            </div>
          </div>

          <div className="w-px h-5 bg-zinc-200 hidden sm:block mx-1"></div>

          {/* Engine Selector Dropdown for Active Layer */}
          <div className="relative">
            <select
              id="select-visualization-engine"
              value={activeLayer?.engine || 'particle_swarm'}
              onChange={(e) =>
                handleEngineChange(e.target.value as EngineType | 'custom_code')
              }
              className="appearance-none pl-3 pr-8 py-1.5 rounded-lg bg-zinc-50 hover:bg-zinc-100 border border-zinc-300 text-xs font-semibold text-zinc-900 cursor-pointer focus:outline-hidden focus:border-zinc-500 transition-colors shadow-2xs"
            >
              {(Object.values(ENGINE_PRESETS) as any[]).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
              <option value="custom_code">Custom Pts.js Code</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Global Action Tools */}
        <div className="flex items-center gap-2">
          {/* AI Help Button */}
          <button
            id="btn-ai-help"
            onClick={() => setIsAiHelpOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-black text-white text-xs font-medium transition-all shadow-xs"
            title="Ask AI to craft custom Pts.js code and dynamic parameters"
          >
            <Bot className="w-3.5 h-3.5 text-zinc-300" />
            <span>AI Help</span>
          </button>

          {/* Code Drawer Toggle */}
          <button
            id="btn-open-code-drawer"
            onClick={() => setIsCodeDrawerOpen(!isCodeDrawerOpen)}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors shadow-2xs ${
              isCodeDrawerOpen
                ? 'bg-zinc-900 text-white border-zinc-900'
                : 'bg-white hover:bg-zinc-50 text-zinc-700 border-zinc-250'
            }`}
            title="Toggle Pts.js Code Drawer"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Code Drawer</span>
          </button>

          {/* Layers Drawer Toggle */}
          <button
            id="btn-open-layers-drawer"
            onClick={() => setIsLayersDrawerOpen(!isLayersDrawerOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors shadow-2xs ${
              isLayersDrawerOpen
                ? 'bg-zinc-900 text-white border-zinc-900'
                : 'bg-white hover:bg-zinc-50 text-zinc-700 border-zinc-250'
            }`}
            title="Toggle Layers slide-out Drawer"
          >
            <Layers className="w-3.5 h-3.5 text-zinc-700" />
            <span>Layers</span>
            <span className="px-1.5 py-0.2 rounded-full text-4xs font-mono bg-zinc-100 text-zinc-700 border border-zinc-200">
              {layers.length}
            </span>
          </button>

          {/* Favorites Button */}
          <button
            id="btn-open-favorites"
            onClick={() => setIsFavoritesOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white hover:bg-zinc-50 border border-zinc-250 text-zinc-700 hover:text-zinc-900 text-xs font-medium transition-colors shadow-2xs"
          >
            <Bookmark className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">Favorites</span>
            {favorites.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-4xs font-mono bg-amber-50 text-amber-800 border border-amber-200">
                {favorites.length}
              </span>
            )}
          </button>

          {/* Import Button */}
          <button
            id="btn-open-import"
            onClick={() => setExportImportModal({ isOpen: true, tab: 'import' })}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white hover:bg-zinc-50 border border-zinc-250 text-zinc-700 hover:text-zinc-900 text-xs font-medium transition-colors shadow-2xs"
            title="Import project (.json)"
          >
            <Upload className="w-3.5 h-3.5 text-zinc-500" />
            <span className="hidden sm:inline">Import</span>
          </button>

          {/* Export Button */}
          <button
            id="btn-open-export"
            onClick={() => setExportImportModal({ isOpen: true, tab: 'export' })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-black text-white text-xs font-semibold transition-colors shadow-xs"
            title="Export project to JSON, PNG, SVG, or standalone HTML"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        </div>
      </header>

      {/* Mobile Tab Toggle Bar (Visible on mobile screens) */}
      <div className="lg:hidden flex items-center justify-around border-b border-zinc-200 bg-white p-1">
        <button
          onClick={() => setMobileTab('preview')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-lg text-center transition-all ${
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
          className={`flex-1 py-1.5 text-xs font-medium rounded-lg text-center transition-all ${
            mobileTab === 'controls'
              ? 'bg-zinc-900 text-white shadow-xs'
              : 'text-zinc-600 hover:text-zinc-900'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 inline mr-1" />
          Variables ({activeVariables.length})
        </button>
      </div>

      {/* Main Studio Split Layout */}
      <main className="flex-1 flex overflow-hidden p-2 sm:p-3 gap-3">
        {/* Left Section: Live Interactive Visualization Preview with Inside Drawers */}
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
            onToggleCodeDrawer={() => setIsCodeDrawerOpen(!isCodeDrawerOpen)}
            isCodeDrawerOpen={isCodeDrawerOpen}
            onToggleLayersDrawer={() => setIsLayersDrawerOpen(!isLayersDrawerOpen)}
            isLayersDrawerOpen={isLayersDrawerOpen}
          >
            {/* 1. Left Slide-out Code Drawer (Extends into visualization frame) */}
            <CodeDrawer
              isOpen={isCodeDrawerOpen}
              onClose={() => setIsCodeDrawerOpen(false)}
              code={activeCode}
              onChangeCode={setActiveCode}
              onRunAndSync={handleRunAndSyncCode}
              variables={activeVariables}
              onOpenAiHelp={() => setIsAiHelpOpen(true)}
              executionError={executionError}
            />

            {/* 2. Right Slide-out Layers Drawer (Extends into visualization frame) */}
            <LayersDrawer
              isOpen={isLayersDrawerOpen}
              onClose={() => setIsLayersDrawerOpen(false)}
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

        {/* Right Section: Randomize Section with Dynamic Variables & Locking Controls */}
        <aside
          id="randomize-section"
          className={`h-full flex-col transition-all duration-300 ${
            mobileTab === 'controls'
              ? 'flex flex-1'
              : 'hidden lg:flex w-[420px] xl:w-[480px] shrink-0'
          }`}
          style={{ minWidth: 0 }}
        >
          <RandomizePanel
            variables={activeVariables}
            onUpdateVariable={handleUpdateVariable}
            onRandomizeAll={handleRandomizeAll}
            onRandomizeCategory={handleRandomizeCategory}
            onLockAll={handleLockAll}
            onInvertLocks={handleInvertLocks}
            onAddVariableClick={(cat) => {
              if (cat) setAddVarCategory(cat);
              setIsAddVariableOpen(true);
            }}
            onRemoveVariable={handleRemoveDynamicVariable}
            intensity={intensity}
            onChangeIntensity={setIntensity}
            isRandomizing={isRandomizing}
            activeLayerName={activeLayer?.name || 'Active Layer'}
            activeLayerIsLocked={activeLayer?.isLocked || false}
            activeLayerRandomizeEnabled={activeLayer?.randomizeEnabled !== false}
            totalLayersCount={layers.length}
            onOpenLayersDrawer={() => setIsLayersDrawerOpen(true)}
          />
        </aside>
      </main>

      {/* Favorites Modal */}
      <FavoritesModal
        isOpen={isFavoritesOpen}
        onClose={() => setIsFavoritesOpen(false)}
        favorites={favorites}
        onLoadFavorite={handleLoadFavorite}
        onSaveCurrentAsFavorite={handleSaveCurrentFavorite}
        onDeleteFavorite={handleDeleteFavorite}
        currentEngine={activeLayer?.engine === 'custom_code' ? 'particle_swarm' : (activeLayer?.engine || 'particle_swarm')}
        currentVariables={activeVariables}
      />

      {/* Export / Import Modal */}
      <ExportImportModal
        isOpen={exportImportModal.isOpen}
        onClose={() => setExportImportModal({ isOpen: false, tab: 'export' })}
        activeTab={exportImportModal.tab}
        engine={activeLayer?.engine === 'custom_code' ? 'particle_swarm' : (activeLayer?.engine || 'particle_swarm')}
        variables={activeVariables}
        onImportConfig={handleImportConfig}
      />

      {/* Add Custom Dynamic Variable Modal */}
      <AddVariableModal
        isOpen={isAddVariableOpen}
        onClose={() => setIsAddVariableOpen(false)}
        onAdd={handleAddDynamicVariable}
        initialCategory={addVarCategory}
      />

      {/* AI Assistance Modal */}
      <AiHelpModal
        isOpen={isAiHelpOpen}
        onClose={() => setIsAiHelpOpen(false)}
        currentCode={activeCode}
        engine={activeLayer?.engine === 'custom_code' ? 'particle_swarm' : (activeLayer?.engine || 'particle_swarm')}
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

      {/* Global Interactive Notification Toast */}
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
}
