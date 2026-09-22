import React, { useState } from 'react';
import { X, Plus, Sliders, Palette, ListFilter, ToggleLeft } from 'lucide-react';
import { DynamicVariable, ParameterCategory, VariableType } from '../types';

interface AddVariableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (variable: DynamicVariable) => void;
  initialCategory?: ParameterCategory;
}

export const AddVariableModal: React.FC<AddVariableModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  initialCategory = 'physics',
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ParameterCategory>(initialCategory);
  const [type, setType] = useState<VariableType>('number');
  const [description, setDescription] = useState('');
  
  // Number configs
  const [min, setMin] = useState(0);
  const [max, setMax] = useState(100);
  const [step, setStep] = useState(1);
  const [unit, setUnit] = useState('');
  const [numDefault, setNumDefault] = useState(50);

  // Color config
  const [colorDefault, setColorDefault] = useState('#00f0ff');

  // Select config
  const [optionsStr, setOptionsStr] = useState('Option A, Option B, Option C');

  // Boolean config
  const [boolDefault, setBoolDefault] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const key = name.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now().toString().slice(-4);
    const id = `custom_${key}`;

    let defaultValue: number | string | boolean = numDefault;
    let options: { label: string; value: string }[] | undefined = undefined;

    if (type === 'number') {
      defaultValue = Number(numDefault);
    } else if (type === 'color') {
      defaultValue = colorDefault;
    } else if (type === 'boolean') {
      defaultValue = boolDefault;
    } else if (type === 'select') {
      const opts = optionsStr
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((opt) => ({
          label: opt,
          value: opt.toLowerCase().replace(/[^a-z0-9]/g, '_'),
        }));
      options = opts.length > 0 ? opts : [{ label: 'Default', value: 'default' }];
      defaultValue = options[0].value;
    }

    const newVar: DynamicVariable = {
      id,
      key,
      name: name.trim(),
      category,
      type,
      value: defaultValue,
      defaultValue,
      min: type === 'number' ? Number(min) : undefined,
      max: type === 'number' ? Number(max) : undefined,
      step: type === 'number' ? Number(step) : undefined,
      unit: type === 'number' && unit.trim() ? unit.trim() : undefined,
      options,
      isLocked: false,
      description: description.trim() || 'Custom user variable',
      isCustom: true,
    };

    onAdd(newVar);
    setName('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-xs">
      <div
        id="modal-add-variable"
        className="w-full max-w-lg bg-white border border-zinc-200/90 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-zinc-900"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200/80 bg-zinc-50/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-zinc-900 text-white shadow-2xs">
              <Plus className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-zinc-900 text-sm">Add Dynamic Variable</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Variable Name */}
          <div>
            <label className="block text-3xs font-medium text-zinc-600 mb-1">Variable Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Turbulence Decay, Photon Bloom..."
              className="w-full px-3 py-1.5 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900 placeholder-zinc-400 focus:outline-hidden focus:border-zinc-600"
            />
          </div>

          {/* Category selection */}
          <div>
            <label className="block text-3xs font-medium text-zinc-600 mb-1">Target Category</label>
            <div className="grid grid-cols-4 gap-2">
              {(['physics', 'function', 'look', 'attributes'] as ParameterCategory[]).map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-2.5 py-1.5 text-xs rounded-lg border capitalize font-medium transition-all ${
                    category === cat
                      ? 'bg-zinc-900 border-zinc-900 text-white shadow-2xs'
                      : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Variable Type */}
          <div>
            <label className="block text-3xs font-medium text-zinc-600 mb-1">Variable Control Type</label>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setType('number')}
                className={`flex flex-col items-center gap-1 p-2 text-xs rounded-lg border transition-all ${
                  type === 'number'
                    ? 'bg-zinc-900 border-zinc-900 text-white shadow-2xs'
                    : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                }`}
              >
                <Sliders className="w-4 h-4" />
                <span>Slider</span>
              </button>
              <button
                type="button"
                onClick={() => setType('color')}
                className={`flex flex-col items-center gap-1 p-2 text-xs rounded-lg border transition-all ${
                  type === 'color'
                    ? 'bg-zinc-900 border-zinc-900 text-white shadow-2xs'
                    : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                }`}
              >
                <Palette className="w-4 h-4" />
                <span>Color</span>
              </button>
              <button
                type="button"
                onClick={() => setType('select')}
                className={`flex flex-col items-center gap-1 p-2 text-xs rounded-lg border transition-all ${
                  type === 'select'
                    ? 'bg-zinc-900 border-zinc-900 text-white shadow-2xs'
                    : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                }`}
              >
                <ListFilter className="w-4 h-4" />
                <span>Dropdown</span>
              </button>
              <button
                type="button"
                onClick={() => setType('boolean')}
                className={`flex flex-col items-center gap-1 p-2 text-xs rounded-lg border transition-all ${
                  type === 'boolean'
                    ? 'bg-zinc-900 border-zinc-900 text-white shadow-2xs'
                    : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                }`}
              >
                <ToggleLeft className="w-4 h-4" />
                <span>Toggle</span>
              </button>
            </div>
          </div>

          {/* Conditional Type Configs */}
          {type === 'number' && (
            <div className="p-3 bg-zinc-50/70 rounded-xl border border-zinc-200 space-y-2.5">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-3xs font-medium text-zinc-600 mb-1">Min</label>
                  <input
                    type="number"
                    value={min}
                    onChange={(e) => setMin(Number(e.target.value))}
                    className="w-full px-2.5 py-1 bg-white border border-zinc-300 rounded text-xs text-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-3xs font-medium text-zinc-600 mb-1">Max</label>
                  <input
                    type="number"
                    value={max}
                    onChange={(e) => setMax(Number(e.target.value))}
                    className="w-full px-2.5 py-1 bg-white border border-zinc-300 rounded text-xs text-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-3xs font-medium text-zinc-600 mb-1">Step</label>
                  <input
                    type="number"
                    step="any"
                    value={step}
                    onChange={(e) => setStep(Number(e.target.value))}
                    className="w-full px-2.5 py-1 bg-white border border-zinc-300 rounded text-xs text-zinc-900"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-3xs font-medium text-zinc-600 mb-1">Default Value</label>
                  <input
                    type="number"
                    value={numDefault}
                    onChange={(e) => setNumDefault(Number(e.target.value))}
                    className="w-full px-2.5 py-1 bg-white border border-zinc-300 rounded text-xs text-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-3xs font-medium text-zinc-600 mb-1">Unit (Optional)</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="px, rad, %, etc."
                    className="w-full px-2.5 py-1 bg-white border border-zinc-300 rounded text-xs text-zinc-900"
                  />
                </div>
              </div>
            </div>
          )}

          {type === 'color' && (
            <div className="p-3 bg-zinc-50/70 rounded-xl border border-zinc-200 flex items-center justify-between">
              <span className="text-xs text-zinc-700">Default Color Value</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={colorDefault}
                  onChange={(e) => setColorDefault(e.target.value)}
                  className="w-7 h-7 rounded border-0 bg-transparent cursor-pointer"
                />
                <span className="text-xs font-mono text-zinc-600">{colorDefault}</span>
              </div>
            </div>
          )}

          {type === 'select' && (
            <div className="p-3 bg-zinc-50/70 rounded-xl border border-zinc-200">
              <label className="block text-3xs font-medium text-zinc-600 mb-1">Comma-separated options</label>
              <input
                type="text"
                value={optionsStr}
                onChange={(e) => setOptionsStr(e.target.value)}
                placeholder="Linear, Quadratic, Exponential..."
                className="w-full px-2.5 py-1 bg-white border border-zinc-300 rounded text-xs text-zinc-900"
              />
            </div>
          )}

          {type === 'boolean' && (
            <div className="p-3 bg-zinc-50/70 rounded-xl border border-zinc-200 flex items-center justify-between">
              <span className="text-xs text-zinc-700">Default Toggle State</span>
              <button
                type="button"
                onClick={() => setBoolDefault(!boolDefault)}
                className={`px-3 py-1 text-xs rounded-md border font-medium ${
                  boolDefault
                    ? 'bg-zinc-900 text-white border-zinc-900'
                    : 'bg-white border-zinc-300 text-zinc-700'
                }`}
              >
                {boolDefault ? 'Enabled (True)' : 'Disabled (False)'}
              </button>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-3xs font-medium text-zinc-600 mb-1">Description (Optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief explanation of how this affects the visual result"
              className="w-full px-3 py-1.5 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900 placeholder-zinc-400 focus:outline-hidden focus:border-zinc-600"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs bg-zinc-900 hover:bg-black text-white font-medium rounded-lg shadow-2xs transition-colors"
            >
              Add Variable
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
