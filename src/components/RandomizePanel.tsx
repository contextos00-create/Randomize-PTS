import React, { useState, useMemo } from 'react';
import {
  Dice5,
  Lock,
  Unlock,
  Sliders,
  RotateCcw,
  Plus,
  Search,
  Sparkles,
  Layers,
  Activity,
  Binary,
  Palette,
  Atom,
  Trash2,
  Check,
  Columns2,
  Rows3,
  SlidersHorizontal,
  ChevronRight,
} from 'lucide-react';
import { DynamicVariable, ParameterCategory, RandomizeIntensity } from '../types';
import { randomizeSingleValue } from '../engines/presets';

interface RandomizePanelProps {
  variables: DynamicVariable[];
  onUpdateVariable: (id: string, updates: Partial<DynamicVariable>) => void;
  onRandomizeAll: () => void;
  onRandomizeCategory: (category: ParameterCategory) => void;
  onLockAll: (locked: boolean) => void;
  onInvertLocks: () => void;
  onAddVariableClick: (category?: ParameterCategory) => void;
  onRemoveVariable: (id: string) => void;
  intensity: RandomizeIntensity;
  onChangeIntensity: (intensity: RandomizeIntensity) => void;
  isRandomizing?: boolean;
  activeLayerName?: string;
  activeLayerIsLocked?: boolean;
  activeLayerRandomizeEnabled?: boolean;
  totalLayersCount?: number;
  onOpenLayersDrawer?: () => void;
}

type TabCategory = 'physics' | 'function' | 'look' | 'behavior' | 'all';

const TAB_CONFIG: Record<
  'physics' | 'function' | 'look' | 'behavior',
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string; dot: string }
> = {
  physics: {
    label: 'Physics',
    icon: Activity,
    color: 'text-sky-600',
    dot: 'bg-sky-500',
  },
  function: {
    label: 'Function',
    icon: Binary,
    color: 'text-violet-600',
    dot: 'bg-violet-500',
  },
  look: {
    label: 'Look',
    icon: Palette,
    color: 'text-rose-600',
    dot: 'bg-rose-500',
  },
  behavior: {
    label: 'Behavior',
    icon: Atom,
    color: 'text-emerald-600',
    dot: 'bg-emerald-500',
  },
};

export const RandomizePanel: React.FC<RandomizePanelProps> = ({
  variables,
  onUpdateVariable,
  onRandomizeAll,
  onRandomizeCategory,
  onLockAll,
  onInvertLocks,
  onAddVariableClick,
  onRemoveVariable,
  intensity,
  onChangeIntensity,
  isRandomizing = false,
  activeLayerName = 'Active Layer',
  activeLayerIsLocked = false,
  activeLayerRandomizeEnabled = true,
  totalLayersCount = 1,
  onOpenLayersDrawer,
}) => {
  // Start on 'physics' to minimize scrolling immediately
  const [activeTab, setActiveTab] = useState<TabCategory>('physics');
  const [searchQuery, setSearchQuery] = useState('');
  const [showLockedOnly, setShowLockedOnly] = useState(false);
  const [isTwoColumn, setIsTwoColumn] = useState(true);

  // Statistics
  const lockedCount = useMemo(() => variables.filter((v) => v.isLocked).length, [variables]);
  const unlockedCount = variables.length - lockedCount;
  const isMaxReached = variables.length >= 20;

  // Filter variables matching tab & search
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

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = v.name.toLowerCase().includes(q);
        const matchesKey = v.key.toLowerCase().includes(q);
        const matchesDesc = v.description?.toLowerCase().includes(q);
        if (!matchesName && !matchesKey && !matchesDesc) return false;
      }
      return true;
    });
  }, [variables, activeTab, showLockedOnly, searchQuery]);

  // Handle single variable randomize
  const handleRandomizeSingle = (v: DynamicVariable) => {
    if (v.isLocked || activeLayerIsLocked) return;
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

  return (
    <div
      id="randomize-control-panel"
      className="flex flex-col h-full bg-white border border-zinc-200/90 rounded-2xl shadow-xs overflow-hidden text-zinc-900"
    >
      {/* Header: Layer Context + Master Randomize */}
      <div className="p-3 border-b border-zinc-200/80 bg-zinc-50/50">
        {/* Layer Context Banner */}
        <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-zinc-200/60">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-zinc-900"></span>
            <span className="text-3xs text-zinc-500 uppercase tracking-wider font-semibold">
              Layer:
            </span>
            <span className="text-xs font-bold text-zinc-900 truncate" title={activeLayerName}>
              {activeLayerName}
            </span>

            {activeLayerIsLocked && (
              <span className="px-1.5 py-0.2 rounded text-4xs font-semibold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-0.5">
                <Lock className="w-2.5 h-2.5" />
                <span>Locked In</span>
              </span>
            )}

            {!activeLayerRandomizeEnabled && (
              <span className="px-1.5 py-0.2 rounded text-4xs font-mono bg-zinc-100 text-zinc-500 border border-zinc-200">
                Randomize: OFF
              </span>
            )}
          </div>

          {onOpenLayersDrawer && (
            <button
              onClick={onOpenLayersDrawer}
              className="flex items-center gap-1 text-3xs font-medium text-zinc-600 hover:text-zinc-900 bg-white hover:bg-zinc-100 px-2 py-0.5 rounded border border-zinc-250 transition-colors shadow-2xs shrink-0"
              title="Open slide-out Layers Drawer"
            >
              <Layers className="w-3 h-3 text-zinc-700" />
              <span>Layers ({totalLayersCount})</span>
              <ChevronRight className="w-2.5 h-2.5" />
            </button>
          )}
        </div>

        {/* Master Randomize Button */}
        <button
          id="btn-master-randomize"
          onClick={onRandomizeAll}
          disabled={isRandomizing || (unlockedCount === 0 && !activeLayerIsLocked)}
          className={`w-full py-2 px-3.5 rounded-xl flex items-center justify-between text-xs font-semibold tracking-wide transition-all shadow-xs ${
            activeLayerIsLocked
              ? 'bg-amber-50 text-amber-800 border border-amber-300 cursor-not-allowed'
              : unlockedCount === 0
              ? 'bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-not-allowed'
              : isRandomizing
              ? 'bg-zinc-800 text-white scale-[0.99]'
              : 'bg-zinc-900 hover:bg-black text-white hover:shadow-md'
          }`}
        >
          <div className="flex items-center gap-2">
            <Dice5
              className={`w-4 h-4 text-zinc-300 ${isRandomizing ? 'animate-spin' : ''}`}
            />
            <span>
              {activeLayerIsLocked
                ? 'Layer Locked In'
                : 'Randomize Parameters'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-3xs font-normal text-zinc-300 bg-zinc-800/80 px-2 py-0.5 rounded-md border border-zinc-700">
              {unlockedCount} unlocked
            </span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded text-4xs font-mono bg-zinc-800 text-zinc-400 border border-zinc-700">
              Space
            </kbd>
          </div>
        </button>

        {/* Intensity Variance & Lock Tools */}
        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-zinc-200/60">
          <div className="flex items-center gap-1">
            <span className="text-4xs uppercase tracking-wider text-zinc-500 font-medium">
              Variance:
            </span>
            <div className="flex bg-zinc-100 p-0.5 rounded-md border border-zinc-200/80">
              {(['gentle', 'balanced', 'wild'] as RandomizeIntensity[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => onChangeIntensity(mode)}
                  className={`px-1.5 py-0.2 rounded text-3xs font-medium capitalize transition-all ${
                    intensity === mode
                      ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                      : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Lock Toggles */}
          <div className="flex items-center gap-1 text-3xs">
            <button
              onClick={() => onLockAll(false)}
              className="px-1.5 py-0.5 rounded text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
              title="Unlock all variables"
            >
              Unlock All
            </button>
            <span className="text-zinc-300">|</span>
            <button
              onClick={() => onLockAll(true)}
              className="px-1.5 py-0.5 rounded text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
              title="Lock all variables"
            >
              Lock All
            </button>
            <span className="text-zinc-300">|</span>
            <button
              onClick={onInvertLocks}
              className="px-1.5 py-0.5 rounded text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
              title="Invert lock states"
            >
              Invert
            </button>
          </div>
        </div>
      </div>

      {/* Tabs: Physics | Function | Look | Behavior | All (Designed to minimize scrolling) */}
      <div className="px-3 py-1.5 border-b border-zinc-200/80 bg-zinc-50/70 flex items-center justify-between gap-1">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5 flex-1">
          {(['physics', 'function', 'look', 'behavior'] as const).map((tab) => {
            const config = TAB_CONFIG[tab];
            const count = getTabCount(tab);
            const isTabActive = activeTab === tab;

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition-all border ${
                  isTabActive
                    ? 'bg-zinc-900 text-white border-zinc-900 font-semibold shadow-2xs'
                    : 'bg-white hover:bg-zinc-100 text-zinc-600 border-zinc-200'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isTabActive ? 'bg-white' : config.dot
                  }`}
                ></span>
                <span>{config.label}</span>
                <span
                  className={`text-3xs font-mono ${
                    isTabActive ? 'text-zinc-300' : 'text-zinc-400'
                  }`}
                >
                  ({count})
                </span>
              </button>
            );
          })}

          {/* All Tab */}
          <button
            onClick={() => setActiveTab('all')}
            className={`px-2 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all border ${
              activeTab === 'all'
                ? 'bg-zinc-900 text-white border-zinc-900 font-semibold shadow-2xs'
                : 'bg-white hover:bg-zinc-100 text-zinc-600 border-zinc-200'
            }`}
          >
            All ({variables.length})
          </button>
        </div>

        {/* View Column Toggle & Add */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setIsTwoColumn((prev) => !prev)}
            className={`p-1 rounded-md border text-3xs transition-all ${
              isTwoColumn
                ? 'bg-zinc-900 text-white border-zinc-900'
                : 'bg-white text-zinc-600 hover:text-zinc-900 border-zinc-200'
            }`}
            title={isTwoColumn ? 'Switch to 1-column view' : 'Switch to compact 2-column view'}
          >
            {isTwoColumn ? <Columns2 className="w-3.5 h-3.5" /> : <Rows3 className="w-3.5 h-3.5" />}
          </button>

          <button
            id="btn-add-variable"
            onClick={() =>
              onAddVariableClick(
                activeTab === 'all' ? 'physics' : (activeTab as ParameterCategory)
              )
            }
            disabled={isMaxReached}
            className={`p-1 rounded-md border transition-colors ${
              isMaxReached
                ? 'bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed'
                : 'bg-white hover:bg-zinc-100 text-zinc-700 border-zinc-300 hover:text-zinc-900'
            }`}
            title={isMaxReached ? 'Max 20 variables reached' : 'Add custom variable'}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tab Context Action Bar: Randomize Active Category & Search */}
      <div className="px-3 py-1.5 border-b border-zinc-200/60 bg-white flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {activeTab !== 'all' ? (
            <button
              onClick={() => onRandomizeCategory(activeTab as ParameterCategory)}
              disabled={activeLayerIsLocked}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-3xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-250 transition-colors"
              title={`Randomize unlocked variables in ${activeTab}`}
            >
              <Dice5 className="w-3 h-3 text-zinc-700" />
              <span>Randomize {TAB_CONFIG[activeTab as keyof typeof TAB_CONFIG]?.label}</span>
            </button>
          ) : (
            <span className="text-3xs text-zinc-500 font-mono">
              Showing all {variables.length} parameters
            </span>
          )}

          {lockedCount > 0 && (
            <button
              onClick={() => setShowLockedOnly((prev) => !prev)}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-3xs font-medium border ${
                showLockedOnly
                  ? 'bg-amber-100 border-amber-300 text-amber-900'
                  : 'bg-amber-50/70 border-amber-200 text-amber-800'
              }`}
            >
              <Lock className="w-2.5 h-2.5 text-amber-600" />
              <span>{lockedCount} Locked</span>
            </button>
          )}
        </div>

        {/* Compact Search */}
        <div className="relative w-36 sm:w-44">
          <Search className="w-3 h-3 text-zinc-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-6 pr-4 py-0.5 text-3xs rounded bg-zinc-50 border border-zinc-250 text-zinc-800 placeholder-zinc-400 focus:outline-hidden focus:border-zinc-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-3xs text-zinc-400 hover:text-zinc-600"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Variables List: Compact Thinner Cards (Minimized Scrolling) */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
        {filteredVariables.length === 0 ? (
          <div className="text-center py-8 px-4 text-zinc-400 text-xs">
            <Sliders className="w-7 h-7 mx-auto mb-1.5 text-zinc-300" />
            <p>No variables found in this tab.</p>
          </div>
        ) : (
          <div
            className={`grid gap-2 ${
              isTwoColumn ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'
            }`}
          >
            {filteredVariables.map((v) => (
              <ThinnerVariableCard
                key={v.id}
                variable={v}
                onUpdate={(updates) => onUpdateVariable(v.id, updates)}
                onRandomize={() => handleRandomizeSingle(v)}
                onRemove={v.isCustom ? () => onRemoveVariable(v.id) : undefined}
                disabled={activeLayerIsLocked}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom Status Bar */}
      <div className="px-3 py-1.5 border-t border-zinc-200/60 bg-zinc-50/70 text-4xs text-zinc-500 flex items-center justify-between">
        <span className="font-mono">
          {filteredVariables.length} visible • {variables.length}/20 max
        </span>
        <span>Click tab above to switch categories</span>
      </div>
    </div>
  );
};

// ==========================================
// THINNER, COMPACT VARIABLE CARD COMPONENT
// ==========================================
interface ThinnerVariableCardProps {
  variable: DynamicVariable;
  onUpdate: (updates: Partial<DynamicVariable>) => void;
  onRandomize: () => void;
  onRemove?: () => void;
  disabled?: boolean;
}

const ThinnerVariableCard: React.FC<ThinnerVariableCardProps> = ({
  variable: v,
  onUpdate,
  onRandomize,
  onRemove,
  disabled = false,
}) => {
  const isLocked = v.isLocked || disabled;

  return (
    <div
      id={`var-card-${v.key}`}
      className={`group relative rounded-xl border p-2 transition-all shadow-2xs ${
        isLocked
          ? 'bg-amber-50/40 border-amber-300 ring-1 ring-amber-300/30'
          : 'bg-white hover:bg-zinc-50/60 border-zinc-200/90 hover:border-zinc-300'
      }`}
    >
      {/* Top Row: Title, Value / Swatch, Single Dice, Lock Button */}
      <div className="flex items-center justify-between gap-1 mb-1">
        <div className="flex items-center gap-1 min-w-0 pr-1">
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              v.category === 'physics'
                ? 'bg-sky-500'
                : v.category === 'function'
                ? 'bg-violet-500'
                : v.category === 'look'
                ? 'bg-rose-500'
                : 'bg-emerald-500'
            }`}
          ></span>
          <span
            className="text-xs font-semibold text-zinc-900 truncate"
            title={`${v.name} (${v.key})${v.description ? ` - ${v.description}` : ''}`}
          >
            {v.name}
          </span>
          {v.isCustom && (
            <span className="px-1 py-0.2 rounded text-4xs uppercase bg-zinc-100 text-zinc-500 border border-zinc-200">
              custom
            </span>
          )}
        </div>

        {/* Right Tools: Value Chip, Dice Randomize, Lock Toggle */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Current Value Display */}
          {v.type === 'number' && (
            <span className="text-3xs font-mono font-medium text-zinc-700 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200">
              {typeof v.value === 'number'
                ? v.value % 1 === 0
                  ? v.value
                  : Number(v.value).toFixed(2)
                : v.value}
              {v.unit || ''}
            </span>
          )}

          {v.type === 'color' && (
            <div className="flex items-center gap-1 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200">
              <span
                className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                style={{ backgroundColor: String(v.value) }}
              ></span>
              <span className="text-4xs font-mono text-zinc-600 uppercase">
                {String(v.value)}
              </span>
            </div>
          )}

          {/* Single Randomize Dice Button */}
          <button
            onClick={onRandomize}
            disabled={isLocked}
            className={`p-1 rounded transition-colors ${
              isLocked
                ? 'text-zinc-300 cursor-not-allowed'
                : 'text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
            title={isLocked ? 'Parameter is locked constant' : `Randomize ${v.name}`}
          >
            <Dice5 className="w-3.5 h-3.5" />
          </button>

          {/* Parameter Lock Button */}
          <button
            onClick={() => onUpdate({ isLocked: !v.isLocked })}
            disabled={disabled}
            className={`p-1 rounded transition-all ${
              v.isLocked
                ? 'text-amber-700 bg-amber-100 border border-amber-300'
                : 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 border border-transparent'
            }`}
            title={v.isLocked ? 'Click to unlock setting' : 'Click to lock in constant value'}
          >
            {v.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          </button>

          {/* Remove button if custom */}
          {onRemove && (
            <button
              onClick={onRemove}
              className="p-1 rounded text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Remove custom variable"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Bottom Row: Slender Input Controls */}
      <div className="mt-1">
        {/* NUMBER SLIDER */}
        {v.type === 'number' && (
          <div className="flex items-center gap-1.5">
            <span className="text-4xs font-mono text-zinc-400 shrink-0">{v.min}</span>
            <input
              type="range"
              min={v.min ?? 0}
              max={v.max ?? 100}
              step={v.step ?? 1}
              value={Number(v.value)}
              disabled={disabled}
              onChange={(e) => onUpdate({ value: parseFloat(e.target.value) })}
              className="w-full h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900"
            />
            <span className="text-4xs font-mono text-zinc-400 shrink-0">{v.max}</span>
          </div>
        )}

        {/* COLOR PICKER */}
        {v.type === 'color' && (
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={String(v.value)}
              disabled={disabled}
              onChange={(e) => onUpdate({ value: e.target.value })}
              className="w-full h-6 rounded cursor-pointer border border-zinc-250 bg-transparent p-0.5"
            />
          </div>
        )}

        {/* SELECT DROPDOWN */}
        {v.type === 'select' && (
          <select
            value={String(v.value)}
            disabled={disabled}
            onChange={(e) => onUpdate({ value: e.target.value })}
            className="w-full py-1 px-2 rounded-md bg-zinc-50 border border-zinc-250 text-3xs text-zinc-800 cursor-pointer focus:outline-hidden focus:border-zinc-500"
          >
            {v.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}

        {/* BOOLEAN TOGGLE */}
        {v.type === 'boolean' && (
          <button
            onClick={() => onUpdate({ value: !v.value })}
            disabled={disabled}
            className={`w-full py-0.5 px-2 rounded-md text-3xs font-medium flex items-center justify-between border transition-all ${
              v.value
                ? 'bg-zinc-900 text-white border-zinc-900'
                : 'bg-zinc-50 text-zinc-600 border-zinc-250'
            }`}
          >
            <span>{v.value ? 'Enabled' : 'Disabled'}</span>
            <span
              className={`w-2 h-2 rounded-full ${v.value ? 'bg-emerald-400' : 'bg-zinc-300'}`}
            ></span>
          </button>
        )}
      </div>
    </div>
  );
};
