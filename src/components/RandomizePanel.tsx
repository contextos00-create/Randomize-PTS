import React, { useState, useMemo } from 'react';
import {
  Lock,
  Unlock,
  Plus,
  Sparkles,
  Activity,
  Binary,
  Palette,
  Atom,
  Trash2,
  Check,
  Columns2,
  Rows3,
  Link2,
  Unlink,
  ExternalLink,
  ChevronDown,
  X,
  Dice5,
} from 'lucide-react';
import {
  DynamicVariable,
  ParameterCategory,
  RandomizeIntensity,
  CanvasLayer,
  AttributeLink,
} from '../types';
import { randomizeSingleValue } from '../engines/presets';

interface RandomizePanelProps {
  variables: DynamicVariable[];
  allLayers?: CanvasLayer[];
  activeLayerId?: string;
  onUpdateVariable: (id: string, updates: Partial<DynamicVariable>) => void;
  onRandomizeCategory: (category: ParameterCategory) => void;
  onLockAll: (locked: boolean) => void;
  onInvertLocks: () => void;
  onAddVariableClick: (category?: ParameterCategory) => void;
  onRemoveVariable: (id: string) => void;
  intensity: RandomizeIntensity;
  activeLayerName?: string;
  activeLayerIsLocked?: boolean;
  activeLayerRandomizeEnabled?: boolean;
}

type TabCategory = 'physics' | 'function' | 'look' | 'behavior' | 'all';

const TAB_CONFIG: Record<
  'physics' | 'function' | 'look' | 'behavior',
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    bgActive: string;
    textActive: string;
    borderActive: string;
    badgeBg: string;
    badgeText: string;
    dot: string;
  }
> = {
  physics: {
    label: 'Physics',
    icon: Activity,
    bgActive: 'bg-sky-500 text-white shadow-md shadow-sky-500/20',
    textActive: 'text-sky-700',
    borderActive: 'border-sky-500',
    badgeBg: 'bg-sky-100',
    badgeText: 'text-sky-800',
    dot: 'bg-sky-500',
  },
  function: {
    label: 'Function',
    icon: Binary,
    bgActive: 'bg-violet-600 text-white shadow-md shadow-violet-600/20',
    textActive: 'text-violet-700',
    borderActive: 'border-violet-500',
    badgeBg: 'bg-violet-100',
    badgeText: 'text-violet-800',
    dot: 'bg-violet-500',
  },
  look: {
    label: 'Look',
    icon: Palette,
    bgActive: 'bg-rose-500 text-white shadow-md shadow-rose-500/20',
    textActive: 'text-rose-700',
    borderActive: 'border-rose-500',
    badgeBg: 'bg-rose-100',
    badgeText: 'text-rose-800',
    dot: 'bg-rose-500',
  },
  behavior: {
    label: 'Behavior',
    icon: Atom,
    bgActive: 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20',
    textActive: 'text-emerald-700',
    borderActive: 'border-emerald-500',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-800',
    dot: 'bg-emerald-500',
  },
};

export const RandomizePanel: React.FC<RandomizePanelProps> = ({
  variables,
  allLayers = [],
  activeLayerId = '',
  onUpdateVariable,
  onRandomizeCategory,
  onLockAll,
  onInvertLocks,
  onAddVariableClick,
  onRemoveVariable,
  intensity,
  activeLayerName = 'Active Layer',
  activeLayerIsLocked = false,
  activeLayerRandomizeEnabled = true,
}) => {
  // Start on 'physics' tab
  const [activeTab, setActiveTab] = useState<TabCategory>('physics');
  const [showLockedOnly, setShowLockedOnly] = useState(false);
  const [isTwoColumn, setIsTwoColumn] = useState(true);

  // Modal / popover state for tying attributes to other layers
  const [linkingVar, setLinkingVar] = useState<DynamicVariable | null>(null);
  const [selectedTargetLayerId, setSelectedTargetLayerId] = useState<string>('');
  const [selectedTargetVarId, setSelectedTargetVarId] = useState<string>('');
  const [linkMultiplier, setLinkMultiplier] = useState<number>(1.0);

  // Available other layers to tie to
  const otherLayers = useMemo(() => {
    return allLayers.filter((l) => l.id !== activeLayerId);
  }, [allLayers, activeLayerId]);

  // Variables available in selected target layer
  const targetLayerVars = useMemo(() => {
    const layer = allLayers.find((l) => l.id === selectedTargetLayerId);
    return layer ? layer.variables : [];
  }, [allLayers, selectedTargetLayerId]);

  // Statistics
  const lockedCount = useMemo(() => variables.filter((v) => v.isLocked).length, [variables]);
  const isMaxReached = variables.length >= 20;

  // Filter variables matching tab
  const filteredVariables = useMemo(() => {
    return variables.filter((v) => {
      if (activeTab !== 'all') {
        if (activeTab === 'behavior') {
          if (v.category !== 'behavior' && v.category !== 'attributes') return false;
        } else if (v.category !== activeTab) {
          return false;
        }
      }
      if (showLockedOnly && !v.isLocked) return false;
      return true;
    });
  }, [variables, activeTab, showLockedOnly]);

  // Handle single variable randomize
  const handleRandomizeSingle = (v: DynamicVariable) => {
    if (v.isLocked || activeLayerIsLocked || v.linkedTo) return;
    const newVal = randomizeSingleValue(v, intensity);
    onUpdateVariable(v.id, { value: newVal });
  };

  // Get count for a tab
  const getTabCount = (tab: TabCategory) => {
    if (tab === 'all') return variables.length;
    if (tab === 'behavior') {
      return variables.filter((v) => v.category === 'behavior' || v.category === 'attributes').length;
    }
    return variables.filter((v) => v.category === tab).length;
  };

  // Open link attribute modal
  const handleOpenLinkModal = (v: DynamicVariable) => {
    setLinkingVar(v);
    if (v.linkedTo) {
      setSelectedTargetLayerId(v.linkedTo.targetLayerId);
      setSelectedTargetVarId(v.linkedTo.targetVarId);
      setLinkMultiplier(v.linkedTo.multiplier ?? 1.0);
    } else {
      const defaultTarget = otherLayers[0];
      if (defaultTarget) {
        setSelectedTargetLayerId(defaultTarget.id);
        const matchingVar = defaultTarget.variables.find((tv) => tv.key === v.key || tv.type === v.type);
        setSelectedTargetVarId(matchingVar?.id || defaultTarget.variables[0]?.id || '');
      }
      setLinkMultiplier(1.0);
    }
  };

  const handleApplyLink = () => {
    if (!linkingVar || !selectedTargetLayerId || !selectedTargetVarId) return;
    onUpdateVariable(linkingVar.id, {
      linkedTo: {
        targetLayerId: selectedTargetLayerId,
        targetVarId: selectedTargetVarId,
        multiplier: linkMultiplier,
      },
    });

    // Also sync initial value from target
    const targetLayer = allLayers.find((l) => l.id === selectedTargetLayerId);
    const targetVar = targetLayer?.variables.find((tv) => tv.id === selectedTargetVarId);
    if (targetVar) {
      let val = targetVar.value;
      if (typeof val === 'number') {
        val = Number((val * linkMultiplier).toFixed(2));
      }
      onUpdateVariable(linkingVar.id, { value: val });
    }

    setLinkingVar(null);
  };

  const handleUnlink = (varId: string) => {
    onUpdateVariable(varId, { linkedTo: undefined });
  };

  // Find linked target info for a variable
  const getLinkedTargetInfo = (link?: AttributeLink) => {
    if (!link) return null;
    const targetLayer = allLayers.find((l) => l.id === link.targetLayerId);
    const targetVar = targetLayer?.variables.find((v) => v.id === link.targetVarId);
    return {
      layerName: targetLayer?.name || 'Other Layer',
      varName: targetVar?.name || 'Attribute',
      multiplier: link.multiplier,
    };
  };

  return (
    <div
      id="randomize-control-panel"
      className="flex flex-col h-full bg-white border border-zinc-200/90 rounded-2xl shadow-xs overflow-hidden text-zinc-900"
    >
      {/* VERY TOP: Big, prominent, color-coded tabs */}
      <div className="p-2 border-b border-zinc-200/90 bg-zinc-50/70">
        <div className="grid grid-cols-5 gap-1.5">
          {(['physics', 'function', 'look', 'behavior'] as const).map((cat) => {
            const config = TAB_CONFIG[cat];
            const Icon = config.icon;
            const isSelected = activeTab === cat;
            const count = getTabCount(cat);

            return (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl font-bold transition-all ${
                  isSelected
                    ? config.bgActive
                    : 'bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200/90'
                }`}
              >
                <div className="flex items-center gap-1">
                  <Icon className="w-3.5 h-3.5" />
                  <span className="text-xs tracking-tight capitalize">{config.label}</span>
                </div>
                <span
                  className={`text-4xs mt-0.5 px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-zinc-100 text-zinc-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}

          {/* "All" Tab */}
          <button
            onClick={() => setActiveTab('all')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl font-bold transition-all ${
              activeTab === 'all'
                ? 'bg-zinc-900 text-white shadow-md'
                : 'bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200/90'
            }`}
          >
            <span className="text-xs tracking-tight">All Tabs</span>
            <span
              className={`text-4xs mt-0.5 px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === 'all'
                  ? 'bg-white/20 text-white'
                  : 'bg-zinc-100 text-zinc-600'
              }`}
            >
              {variables.length}
            </span>
          </button>
        </div>
      </div>

      {/* Sub-Header: Active Tab Controls + Coral Orange Add Button */}
      <div className="px-3.5 py-2 border-b border-zinc-200/80 bg-white flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Quick Category Randomize */}
          {activeTab !== 'all' && (
            <button
              onClick={() => onRandomizeCategory(activeTab as ParameterCategory)}
              disabled={activeLayerIsLocked}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-3xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-250 transition-colors shadow-2xs"
              title={`Randomize ${activeTab} variables`}
            >
              <Dice5 className="w-3 h-3 text-zinc-600" />
              <span>Randomize {activeTab}</span>
            </button>
          )}

          {/* Lock/Unlock All Toggle */}
          <button
            onClick={() => onLockAll(lockedCount < variables.length)}
            disabled={activeLayerIsLocked}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-3xs font-medium text-zinc-600 hover:text-zinc-900 bg-white hover:bg-zinc-50 border border-zinc-250 transition-colors"
            title={lockedCount < variables.length ? 'Lock all variables' : 'Unlock all variables'}
          >
            {lockedCount < variables.length ? (
              <>
                <Lock className="w-3 h-3 text-zinc-500" />
                <span className="hidden sm:inline">Lock All</span>
              </>
            ) : (
              <>
                <Unlock className="w-3 h-3 text-amber-600" />
                <span className="hidden sm:inline">Unlock All</span>
              </>
            )}
          </button>

          {/* Column Layout Switcher */}
          <button
            onClick={() => setIsTwoColumn(!isTwoColumn)}
            className="p-1 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 border border-zinc-250 transition-colors"
            title={isTwoColumn ? 'Switch to single column' : 'Switch to two columns'}
          >
            {isTwoColumn ? <Rows3 className="w-3.5 h-3.5" /> : <Columns2 className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Prominent Coral Orange Add Parameter Button */}
        <button
          id="btn-add-parameter"
          onClick={() =>
            onAddVariableClick(activeTab !== 'all' ? (activeTab as ParameterCategory) : undefined)
          }
          disabled={isMaxReached || activeLayerIsLocked}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs tracking-wide transition-all shadow-md ${
            isMaxReached || activeLayerIsLocked
              ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
              : 'bg-[#ff6b4a] hover:bg-[#fa5a35] text-white shadow-[#ff6b4a]/20 hover:scale-[1.02]'
          }`}
          title="Add a custom dynamic parameter (Max 20)"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>+ Add Parameter</span>
        </button>
      </div>

      {/* Expanded Variables List */}
      <div className="flex-1 overflow-y-auto p-3 bg-zinc-50/40">
        {filteredVariables.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center p-4 border border-dashed border-zinc-200 rounded-xl bg-white">
            <Sparkles className="w-6 h-6 text-zinc-300 mb-2" />
            <p className="text-xs font-semibold text-zinc-700">No parameters in this tab</p>
            <p className="text-3xs text-zinc-400 mt-1 max-w-xs">
              Click the coral orange "+ Add Parameter" button above to add custom dynamic controls.
            </p>
          </div>
        ) : (
          <div
            className={`grid gap-2.5 ${
              isTwoColumn ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'
            }`}
          >
            {filteredVariables.map((v) => {
              const categoryConfig = TAB_CONFIG[v.category as keyof typeof TAB_CONFIG];
              const isLocked = v.isLocked || activeLayerIsLocked;
              const linkedInfo = getLinkedTargetInfo(v.linkedTo);

              return (
                <div
                  key={v.id}
                  className={`relative p-2.5 rounded-xl border transition-all ${
                    isLocked
                      ? 'bg-amber-50/40 border-amber-200'
                      : v.linkedTo
                      ? 'bg-sky-50/40 border-sky-200 ring-1 ring-sky-300/40'
                      : 'bg-white border-zinc-200/90 hover:border-zinc-300 shadow-2xs'
                  }`}
                >
                  {/* Top Row: Name, Lock & Attribute Link Button */}
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          categoryConfig?.dot || 'bg-zinc-400'
                        }`}
                      />
                      <span
                        className="text-xs font-bold text-zinc-900 truncate"
                        title={`${v.name} (${v.key})`}
                      >
                        {v.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-0.5 shrink-0">
                      {/* Tie Attribute / Link Button */}
                      {otherLayers.length > 0 && (
                        <button
                          onClick={() => handleOpenLinkModal(v)}
                          className={`p-1 rounded-md transition-colors ${
                            v.linkedTo
                              ? 'text-sky-600 bg-sky-100 hover:bg-sky-200'
                              : 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100'
                          }`}
                          title={
                            v.linkedTo
                              ? `Tied to ${linkedInfo?.layerName} • ${linkedInfo?.varName}`
                              : 'Tie this attribute to another layer'
                          }
                        >
                          <Link2 className="w-3 h-3" />
                        </button>
                      )}

                      {/* Randomize Single Variable Button */}
                      {!isLocked && !v.linkedTo && (
                        <button
                          onClick={() => handleRandomizeSingle(v)}
                          className="p-1 rounded-md text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition-colors"
                          title="Randomize single value"
                        >
                          <Dice5 className="w-3 h-3" />
                        </button>
                      )}

                      {/* Lock Toggle */}
                      <button
                        onClick={() => onUpdateVariable(v.id, { isLocked: !v.isLocked })}
                        disabled={activeLayerIsLocked}
                        className={`p-1 rounded-md transition-colors ${
                          v.isLocked
                            ? 'text-amber-600 bg-amber-100 hover:bg-amber-200'
                            : 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100'
                        }`}
                        title={v.isLocked ? 'Unlock parameter' : 'Lock in parameter'}
                      >
                        {v.isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                      </button>

                      {/* Custom Delete */}
                      {v.isCustom && (
                        <button
                          onClick={() => onRemoveVariable(v.id)}
                          className="p-1 rounded-md text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete custom parameter"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Tied Attribute Indicator Pill */}
                  {v.linkedTo && linkedInfo && (
                    <div className="mb-2 px-2 py-0.5 rounded-lg bg-sky-100/80 border border-sky-200 flex items-center justify-between text-4xs font-mono text-sky-800">
                      <span className="truncate flex items-center gap-1">
                        <Link2 className="w-2.5 h-2.5 text-sky-600 shrink-0" />
                        <span className="truncate">
                          Tied to: <strong>{linkedInfo.layerName}</strong> • {linkedInfo.varName}
                          {linkedInfo.multiplier && linkedInfo.multiplier !== 1 ? ` (×${linkedInfo.multiplier})` : ''}
                        </span>
                      </span>
                      <button
                        onClick={() => handleUnlink(v.id)}
                        className="p-0.5 text-sky-600 hover:text-red-600 ml-1 shrink-0"
                        title="Unlink attribute"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  )}

                  {/* Slider or Color Control */}
                  {v.type === 'number' && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-3xs font-mono text-zinc-600">
                        <span className="text-4xs text-zinc-400">
                          {v.min ?? 0}
                        </span>
                        <span className="font-bold text-zinc-900">
                          {v.value}
                          {v.unit || ''}
                        </span>
                        <span className="text-4xs text-zinc-400">
                          {v.max ?? 100}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={v.min ?? 0}
                        max={v.max ?? 100}
                        step={v.step ?? 1}
                        value={Number(v.value)}
                        disabled={isLocked || !!v.linkedTo}
                        onChange={(e) =>
                          onUpdateVariable(v.id, { value: parseFloat(e.target.value) })
                        }
                        className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900 disabled:opacity-40 disabled:cursor-not-allowed"
                      />
                    </div>
                  )}

                  {v.type === 'color' && (
                    <div className="flex items-center gap-2 pt-0.5">
                      <input
                        type="color"
                        value={String(v.value)}
                        disabled={isLocked || !!v.linkedTo}
                        onChange={(e) => onUpdateVariable(v.id, { value: e.target.value })}
                        className="w-7 h-7 rounded-lg border border-zinc-200 p-0.5 cursor-pointer disabled:opacity-40"
                      />
                      <span className="text-xs font-mono font-medium text-zinc-700">
                        {String(v.value).toUpperCase()}
                      </span>
                    </div>
                  )}

                  {v.type === 'boolean' && (
                    <div className="flex items-center justify-between pt-0.5">
                      <span className="text-3xs font-medium text-zinc-600">Toggle State</span>
                      <button
                        onClick={() => onUpdateVariable(v.id, { value: !v.value })}
                        disabled={isLocked || !!v.linkedTo}
                        className={`px-2 py-0.5 rounded text-3xs font-semibold border transition-all ${
                          v.value
                            ? 'bg-zinc-900 text-white border-zinc-900'
                            : 'bg-zinc-100 text-zinc-500 border-zinc-200'
                        }`}
                      >
                        {v.value ? 'Enabled' : 'Disabled'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Attribute Linking Modal / Popover */}
      {linkingVar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-md p-5 space-y-4 text-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-sky-500 text-white">
                  <Link2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Tie Attribute Across Layers</h3>
                  <p className="text-4xs text-zinc-500">
                    Sync "{linkingVar.name}" with an attribute in another layer
                  </p>
                </div>
              </div>
              <button
                onClick={() => setLinkingVar(null)}
                className="p-1 text-zinc-400 hover:text-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {otherLayers.length === 0 ? (
              <div className="p-4 bg-zinc-50 rounded-xl text-center text-xs text-zinc-500">
                You only have 1 layer. Add another layer in the Layers Drawer to tie attributes!
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Select Target Layer
                  </label>
                  <select
                    value={selectedTargetLayerId}
                    onChange={(e) => {
                      setSelectedTargetLayerId(e.target.value);
                      const target = allLayers.find((l) => l.id === e.target.value);
                      if (target && target.variables[0]) {
                        setSelectedTargetVarId(target.variables[0].id);
                      }
                    }}
                    className="w-full px-3 py-1.5 rounded-xl border border-zinc-300 text-xs bg-white text-zinc-900 focus:outline-hidden"
                  >
                    {otherLayers.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Select Target Attribute to Tie With
                  </label>
                  <select
                    value={selectedTargetVarId}
                    onChange={(e) => setSelectedTargetVarId(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-zinc-300 text-xs bg-white text-zinc-900 focus:outline-hidden"
                  >
                    {targetLayerVars.map((tv) => (
                      <option key={tv.id} value={tv.id}>
                        {tv.name} ({tv.category} • {tv.type})
                      </option>
                    ))}
                  </select>
                </div>

                {linkingVar.type === 'number' && (
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Multiplier / Ratio: <span className="text-sky-600 font-bold">{linkMultiplier}×</span>
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[0.5, 1.0, 1.5, 2.0].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setLinkMultiplier(m)}
                          className={`py-1 rounded-lg text-xs font-mono font-medium border transition-colors ${
                            linkMultiplier === m
                              ? 'bg-sky-500 text-white border-sky-500 font-bold'
                              : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                          }`}
                        >
                          {m}×
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-between border-t border-zinc-100">
                  {linkingVar.linkedTo && (
                    <button
                      type="button"
                      onClick={() => {
                        handleUnlink(linkingVar.id);
                        setLinkingVar(null);
                      }}
                      className="text-xs text-red-600 hover:underline flex items-center gap-1"
                    >
                      <Unlink className="w-3.5 h-3.5" />
                      <span>Unlink</span>
                    </button>
                  )}
                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      type="button"
                      onClick={() => setLinkingVar(null)}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyLink}
                      className="px-4 py-1.5 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white shadow-xs flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Tie Attribute</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
