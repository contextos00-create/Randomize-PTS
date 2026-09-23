import { create } from 'zustand';
import { CanvasLayer, DynamicVariable, PtsCodeFile, RandomizeIntensity } from '../types';
import { DEFAULT_PTS_CODE_FILES } from '../engines/codePresets';

interface StudioState {
  codeFiles: PtsCodeFile[];
  activeCodeFileId: string;
  setActiveCodeFileId: (id: string) => void;
  updateCodeFile: (id: string, code: string) => void;
  addCodeFile: (name: string, code?: string) => void;
  deleteCodeFile: (id: string) => void;
}

export const useStudioStore = create<StudioState>((set) => ({
  codeFiles: DEFAULT_PTS_CODE_FILES,
  activeCodeFileId: DEFAULT_PTS_CODE_FILES[0].id,
  setActiveCodeFileId: (id: string) => set({ activeCodeFileId: id }),
  updateCodeFile: (id: string, code: string) =>
    set((state) => ({
      codeFiles: state.codeFiles.map((f) => (f.id === id ? { ...f, code } : f)),
    })),
  addCodeFile: (name: string, code?: string) =>
    set((state) => {
      const newFile: PtsCodeFile = {
        id: `file-${Date.now()}`,
        name: name.endsWith('.tsx') || name.endsWith('.ts') ? name : `${name}.tsx`,
        description: 'Custom user code file',
        code:
          code ||
          `// ${name}\n// @param {slider} name="Intensity" key="intensity" min=1 max=10 step=0.5 val=5 cat="physics"\n\nfunction render(form, space, time, v, pointer) {\n  form.fill("#ff0077").point(space.center, 20, "circle");\n}`,
      };
      return {
        codeFiles: [...state.codeFiles, newFile],
        activeCodeFileId: newFile.id,
      };
    }),
  deleteCodeFile: (id: string) =>
    set((state) => {
      if (state.codeFiles.length <= 1) return state;
      const nextFiles = state.codeFiles.filter((f) => f.id !== id);
      return {
        codeFiles: nextFiles,
        activeCodeFileId:
          state.activeCodeFileId === id ? nextFiles[0].id : state.activeCodeFileId,
      };
    }),
}));

/**
 * Utility to propagate linked variable changes across all layers.
 * When a variable in any layer changes, any variable in another layer linked to it gets synchronized.
 */
export function syncLinkedVariables(
  layers: CanvasLayer[],
  sourceLayerId: string,
  sourceVarId: string,
  newValue: any
): CanvasLayer[] {
  let hasChanges = false;
  const newLayers = layers.map((layer) => {
    let layerChanged = false;
    const newVars = layer.variables.map((v) => {
      if (
        v.linkedTo &&
        v.linkedTo.targetLayerId === sourceLayerId &&
        v.linkedTo.targetVarId === sourceVarId
      ) {
        layerChanged = true;
        hasChanges = true;
        let syncedValue = newValue;
        if (typeof newValue === 'number') {
          const mult = v.linkedTo.multiplier ?? 1.0;
          syncedValue = Number((newValue * mult).toFixed(2));
          if (v.min !== undefined) syncedValue = Math.max(v.min, syncedValue);
          if (v.max !== undefined) syncedValue = Math.min(v.max, syncedValue);
        }
        return { ...v, value: syncedValue };
      }
      return v;
    });

    if (layerChanged) {
      return { ...layer, variables: newVars };
    }
    return layer;
  });

  return hasChanges ? newLayers : layers;
}
