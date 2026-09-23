/**
 * Types for Pts.js Visualization Randomizer
 */

export type ParameterCategory = 'physics' | 'function' | 'look' | 'behavior' | 'attributes';

export type VariableType = 'number' | 'color' | 'select' | 'boolean';

export interface SelectOption {
  label: string;
  value: string;
}

export interface AttributeLink {
  targetLayerId: string;
  targetVarId: string;
  multiplier?: number; // e.g., 1.0 (exact match), 0.5 (half), 2.0 (double)
}

export interface DynamicVariable {
  id: string;
  key: string;
  name: string;
  category: ParameterCategory;
  type: VariableType;
  value: number | string | boolean;
  defaultValue: number | string | boolean;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  options?: SelectOption[];
  isLocked: boolean;
  description?: string;
  isCustom?: boolean;
  linkedTo?: AttributeLink; // Tie attribute to another attribute in another layer
}

export type EngineType =
  | 'particle_swarm'
  | 'harmonic_mesh'
  | 'geometric_delaunay'
  | 'kinetic_ribbons'
  | 'cosmic_attractor';

export interface CanvasLayer {
  id: string;
  name: string;
  engine: EngineType | 'custom_code';
  variables: DynamicVariable[];
  customCode?: string;
  isVisible: boolean;
  opacity: number; // 0.0 to 1.0
  blendMode: GlobalCompositeOperation;
  randomizeEnabled: boolean; // whether randomize effects this layer
  isLocked: boolean; // whether layer is locked in
  createdAt: number;
}

export interface PtsCodeFile {
  id: string;
  name: string;
  description: string;
  code: string;
  isDefault?: boolean;
}

export interface EnginePresetInfo {
  id: EngineType;
  name: string;
  description: string;
  defaultVariables: DynamicVariable[];
}

export interface SavedConfiguration {
  id: string;
  name: string;
  createdAt: number;
  engine: EngineType;
  variables: DynamicVariable[];
  previewPalette: string[];
  tags: string[];
  notes?: string;
}

export type RandomizeIntensity = 'gentle' | 'balanced' | 'wild';

export interface ExportSettings {
  format: 'json' | 'png' | 'svg' | 'html';
  resolutionScale: number; // 1x, 2x, 4x
  transparentBg: boolean;
  includeTimestamp: boolean;
}

export interface CustomCodeState {
  code: string;
  isEnabled: boolean;
  lastError: string | null;
}
