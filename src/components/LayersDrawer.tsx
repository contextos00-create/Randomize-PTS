import React, { useState } from 'react';
import {
  Layers,
  Plus,
  X,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Dice5,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Sliders,
  Code2,
  Check,
  Edit2,
} from 'lucide-react';
import { CanvasLayer, EngineType } from '../types';
import { ENGINE_PRESETS } from '../engines/presets';

interface LayersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  layers: CanvasLayer[];
  activeLayerId: string;
  onSelectLayer: (layerId: string) => void;
  onAddLayer: (engine: EngineType | 'custom_code', name?: string) => void;
  onUpdateLayer: (layerId: string, updates: Partial<CanvasLayer>) => void;
  onDuplicateLayer: (layerId: string) => void;
  onDeleteLayer: (layerId: string) => void;
  onReorderLayer: (layerId: string, direction: 'up' | 'down') => void;
  onRandomizeLayer: (layerId: string) => void;
  onRandomizeAllEligible: () => void;
}

const BLEND_MODES: { label: string; value: GlobalCompositeOperation }[] = [
  { label: 'Normal (Source Over)', value: 'source-over' },
  { label: 'Screen (Glow / Add)', value: 'screen' },
  { label: 'Lighter (Additive)', value: 'lighter' },
  { label: 'Multiply (Darken)', value: 'multiply' },
  { label: 'Overlay (High Contrast)', value: 'overlay' },
  { label: 'Color Dodge (Vivid)', value: 'color-dodge' },
  { label: 'Difference (Invert)', value: 'difference' },
];

export const LayersDrawer: React.FC<LayersDrawerProps> = ({
  isOpen,
  onClose,
  layers,
  activeLayerId,
  onSelectLayer,
  onAddLayer,
  onUpdateLayer,
  onDuplicateLayer,
  onDeleteLayer,
  onReorderLayer,
  onRandomizeLayer,
  onRandomizeAllEligible,
}) => {
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');

  const handleStartRename = (layer: CanvasLayer) => {
    setEditingNameId(layer.id);
    setTempName(layer.name);
  };

  const handleSaveRename = (layerId: string) => {
    if (tempName.trim()) {
      onUpdateLayer(layerId, { name: tempName.trim() });
    }
    setEditingNameId(null);
  };

  const handleAddPreset = (engine: EngineType | 'custom_code') => {
    const engineName =
      engine === 'custom_code'
        ? 'Custom Code'
        : ENGINE_PRESETS[engine]?.name.split(' ')[0] || 'Layer';
    const name = `Layer ${layers.length + 1} (${engineName})`;
    onAddLayer(engine, name);
    setIsAddMenuOpen(false);
  };

  return (
    <div
      id="layers-slideout-drawer"
      className={`absolute top-0 right-0 bottom-0 z-30 w-80 sm:w-96 bg-white/95 backdrop-blur-md border-l border-zinc-200/90 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out text-zinc-900 ${
        isOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
      }`}
    >
      {/* Drawer Header */}
      <div className="px-4 py-3 border-b border-zinc-200/80 bg-zinc-50/70 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-zinc-900 text-white shadow-2xs">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-semibold text-zinc-900">Layers</h3>
              <span className="text-3xs font-mono px-1.5 py-0.2 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-600">
                {layers.length}
              </span>
            </div>
            <p className="text-4xs text-zinc-500">Stack, blend, and control randomize</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Add Layer Button */}
          <div className="relative">
            <button
              onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-zinc-900 hover:bg-black text-white text-3xs font-medium transition-colors shadow-2xs"
              title="Add a new visualization layer"
            >
              <Plus className="w-3 h-3" />
              <span>Add</span>
            </button>

            {/* Add Layer Dropdown Menu */}
            {isAddMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-zinc-200 rounded-xl shadow-xl z-50 p-1.5 space-y-1 text-xs animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2 py-1 text-4xs font-semibold uppercase tracking-wider text-zinc-400">
                  Select Engine Preset
                </div>
                {(Object.keys(ENGINE_PRESETS) as EngineType[]).map((eng) => (
                  <button
                    key={eng}
                    onClick={() => handleAddPreset(eng)}
                    className="w-full text-left px-2 py-1 rounded-md hover:bg-zinc-100 flex items-center justify-between text-3xs font-medium text-zinc-800 transition-colors"
                  >
                    <span>{ENGINE_PRESETS[eng].name}</span>
                    <Sparkles className="w-3 h-3 text-zinc-400" />
                  </button>
                ))}
                <div className="border-t border-zinc-100 my-1"></div>
                <button
                  onClick={() => handleAddPreset('custom_code')}
                  className="w-full text-left px-2 py-1 rounded-md hover:bg-zinc-100 flex items-center justify-between text-3xs font-medium text-violet-700 hover:text-violet-900 transition-colors"
                >
                  <span className="flex items-center gap-1">
                    <Code2 className="w-3 h-3" />
                    <span>Custom Code Layer</span>
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Close Drawer Button */}
          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition-colors"
            title="Close Layers Drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Summary & Randomize All Unlocked Layers */}
      <div className="px-3.5 py-2 border-b border-zinc-200/60 bg-white flex items-center justify-between gap-2">
        <span className="text-4xs text-zinc-500 font-mono">
          {layers.filter((l) => l.randomizeEnabled && !l.isLocked).length} / {layers.length} affected by randomize
        </span>

        <button
          onClick={onRandomizeAllEligible}
          className="flex items-center gap-1 px-2 py-0.5 rounded text-3xs font-medium bg-zinc-100 hover:bg-zinc-200 border border-zinc-250 text-zinc-800 transition-colors"
          title="Randomize unlocked variables in all layers where randomize is enabled"
        >
          <Dice5 className="w-3 h-3 text-zinc-600" />
          <span>Randomize Active Layers</span>
        </button>
      </div>

      {/* Layers List (Top to Bottom rendering order) */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {layers.map((layer, index) => {
          const isActive = layer.id === activeLayerId;
          const isTop = index === 0;
          const isBottom = index === layers.length - 1;

          return (
            <div
              key={layer.id}
              onClick={() => onSelectLayer(layer.id)}
              className={`group relative rounded-xl border transition-all cursor-pointer ${
                isActive
                  ? 'bg-zinc-50/90 border-zinc-900 shadow-xs ring-1 ring-zinc-900/10'
                  : 'bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/40'
              }`}
            >
              {/* Layer Header Row */}
              <div className="p-2.5 flex items-center justify-between gap-2 border-b border-zinc-100">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {/* Active Indicator dot */}
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      isActive ? 'bg-zinc-900 ring-2 ring-zinc-300' : 'bg-zinc-300'
                    }`}
                  />

                  {/* Name or Rename Input */}
                  {editingNameId === layer.id ? (
                    <div
                      className="flex items-center gap-1 flex-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(layer.id);
                          if (e.key === 'Escape') setEditingNameId(null);
                        }}
                        autoFocus
                        className="px-1.5 py-0.5 text-xs font-semibold text-zinc-900 bg-white border border-zinc-300 rounded focus:outline-hidden"
                      />
                      <button
                        onClick={() => handleSaveRename(layer.id)}
                        className="p-1 text-emerald-600 hover:text-emerald-700"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 truncate">
                      <h4 className="text-xs font-semibold text-zinc-900 truncate">
                        {layer.name}
                      </h4>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartRename(layer);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-zinc-600 transition-opacity"
                        title="Rename layer"
                      >
                        <Edit2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Reorder Buttons */}
                <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onReorderLayer(layer.id, 'up')}
                    disabled={isTop}
                    className={`p-0.5 rounded text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 ${
                      isTop ? 'opacity-30 cursor-not-allowed' : ''
                    }`}
                    title="Move Layer Up"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => onReorderLayer(layer.id, 'down')}
                    disabled={isBottom}
                    className={`p-0.5 rounded text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 ${
                      isBottom ? 'opacity-30 cursor-not-allowed' : ''
                    }`}
                    title="Move Layer Down"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Layer Controls Row: Randomize Toggle & Lock In Toggle & Visibility */}
              <div
                className="px-2.5 py-2 flex items-center justify-between gap-1 text-3xs border-b border-zinc-100 bg-zinc-50/40"
                onClick={(e) => e.stopPropagation()}
              >
                {/* 1. Randomize Toggle Button ("choose whether randomize effects a layer or not") */}
                <button
                  onClick={() =>
                    onUpdateLayer(layer.id, { randomizeEnabled: !layer.randomizeEnabled })
                  }
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded border transition-all ${
                    layer.randomizeEnabled
                      ? 'bg-zinc-900 text-white border-zinc-900 font-semibold'
                      : 'bg-white text-zinc-400 border-zinc-200 hover:text-zinc-700'
                  }`}
                  title={
                    layer.randomizeEnabled
                      ? 'Randomize affects this layer (Click to exclude)'
                      : 'Randomize will NOT affect this layer (Click to include)'
                  }
                >
                  <Dice5 className="w-3 h-3" />
                  <span>{layer.randomizeEnabled ? 'Randomize: ON' : 'Randomize: OFF'}</span>
                </button>

                {/* 2. Lock In Toggle ("lock a layer in") */}
                <button
                  onClick={() => onUpdateLayer(layer.id, { isLocked: !layer.isLocked })}
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded border transition-all ${
                    layer.isLocked
                      ? 'bg-amber-100 border-amber-300 text-amber-900 font-semibold shadow-2xs'
                      : 'bg-white text-zinc-500 border-zinc-200 hover:text-zinc-800'
                  }`}
                  title={
                    layer.isLocked
                      ? 'Layer is LOCKED IN (Parameters protected from randomize and bulk edits)'
                      : 'Layer is unlocked (Click to lock in)'
                  }
                >
                  {layer.isLocked ? (
                    <Lock className="w-3 h-3 text-amber-600" />
                  ) : (
                    <Unlock className="w-3 h-3 text-zinc-400" />
                  )}
                  <span>{layer.isLocked ? 'Locked In' : 'Unlocked'}</span>
                </button>

                {/* 3. Visibility Toggle */}
                <button
                  onClick={() => onUpdateLayer(layer.id, { isVisible: !layer.isVisible })}
                  className={`p-1 rounded transition-colors ${
                    layer.isVisible
                      ? 'text-zinc-700 hover:bg-zinc-100'
                      : 'text-zinc-300 hover:text-zinc-600'
                  }`}
                  title={layer.isVisible ? 'Hide Layer' : 'Show Layer'}
                >
                  {layer.isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Layer Settings: Blend Mode & Opacity */}
              <div
                className="p-2.5 space-y-2 text-3xs"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Opacity Slider */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-zinc-500 font-medium w-12">Opacity:</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={layer.opacity}
                    onChange={(e) =>
                      onUpdateLayer(layer.id, { opacity: parseFloat(e.target.value) })
                    }
                    className="flex-1 h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900"
                  />
                  <span className="w-8 text-right font-mono text-zinc-600">
                    {Math.round(layer.opacity * 100)}%
                  </span>
                </div>

                {/* Blend Mode Selector */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-zinc-500 font-medium w-12">Blend:</span>
                  <select
                    value={layer.blendMode}
                    onChange={(e) =>
                      onUpdateLayer(layer.id, {
                        blendMode: e.target.value as GlobalCompositeOperation,
                      })
                    }
                    className="flex-1 px-1.5 py-0.5 rounded bg-white border border-zinc-250 text-zinc-800 text-3xs focus:outline-hidden cursor-pointer"
                  >
                    {BLEND_MODES.map((b) => (
                      <option key={b.value} value={b.value}>
                        {b.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Layer Footer / Actions: Duplicate & Delete */}
                <div className="pt-1.5 border-t border-zinc-100 flex items-center justify-between text-4xs text-zinc-400">
                  <span className="font-mono">
                    {layer.engine === 'custom_code'
                      ? 'Pts.js Code'
                      : ENGINE_PRESETS[layer.engine]?.name || 'Engine'}
                  </span>

                  <div className="flex items-center gap-1">
                    {/* Randomize Single Layer */}
                    {layer.randomizeEnabled && !layer.isLocked && (
                      <button
                        onClick={() => onRandomizeLayer(layer.id)}
                        className="px-1.5 py-0.5 rounded text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors flex items-center gap-1"
                        title="Randomize this layer's unlocked variables"
                      >
                        <Dice5 className="w-2.5 h-2.5" />
                        <span>Randomize</span>
                      </button>
                    )}

                    {/* Duplicate Layer */}
                    <button
                      onClick={() => onDuplicateLayer(layer.id)}
                      className="p-1 rounded text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition-colors"
                      title="Duplicate this layer"
                    >
                      <Copy className="w-3 h-3" />
                    </button>

                    {/* Delete Layer (Only if > 1 layer) */}
                    {layers.length > 1 && (
                      <button
                        onClick={() => onDeleteLayer(layer.id)}
                        className="p-1 rounded text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete layer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Drawer Footer Info */}
      <div className="px-3.5 py-2.5 border-t border-zinc-200/80 bg-zinc-50/60 text-4xs text-zinc-500 flex items-center justify-between">
        <span>Click any layer to view and edit its parameters in main panel</span>
        <span className="font-mono">{layers.length} layers</span>
      </div>
    </div>
  );
};
