import React, { useState } from 'react';
import {
  X,
  Bookmark,
  Plus,
  Trash2,
  Download,
  Calendar,
  Layers,
  ArrowRight,
  Sparkles,
  Check,
  Edit2,
} from 'lucide-react';
import { SavedConfiguration, DynamicVariable, EngineType } from '../types';

interface FavoritesModalProps {
  isOpen: boolean;
  onClose: () => void;
  favorites: SavedConfiguration[];
  onLoadFavorite: (config: SavedConfiguration) => void;
  onSaveCurrentAsFavorite: (name: string, notes?: string) => void;
  onDeleteFavorite: (id: string) => void;
  currentEngine: EngineType;
  currentVariables: DynamicVariable[];
}

export const FavoritesModal: React.FC<FavoritesModalProps> = ({
  isOpen,
  onClose,
  favorites,
  onLoadFavorite,
  onSaveCurrentAsFavorite,
  onDeleteFavorite,
  currentEngine,
  currentVariables,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [justSavedId, setJustSavedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onSaveCurrentAsFavorite(newName.trim(), newNotes.trim());
    setNewName('');
    setNewNotes('');
    setIsCreating(false);
  };

  const handleLoad = (config: SavedConfiguration) => {
    onLoadFavorite(config);
    setJustSavedId(config.id);
    setTimeout(() => {
      onClose();
    }, 400);
  };

  const exportSingleAsJson = (config: SavedConfiguration) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(config, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `pts-${config.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.json`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-xs">
      <div
        id="modal-favorites"
        className="w-full max-w-2xl bg-white border border-zinc-200/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200 text-zinc-900"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200/80 bg-zinc-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-600">
              <Bookmark className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 text-sm">Favorite Configurations</h3>
              <p className="text-3xs text-zinc-500">Save and reload custom parameter states</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isCreating && (
              <button
                id="btn-trigger-save-favorite"
                onClick={() => setIsCreating(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-black text-white font-medium text-xs transition-colors shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save Current</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Create Favorite Sub-form */}
        {isCreating && (
          <form onSubmit={handleCreateSubmit} className="p-4 bg-zinc-50/80 border-b border-zinc-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-800">Save Current Configuration</span>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="text-xs text-zinc-500 hover:text-zinc-800"
              >
                Cancel
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-3xs font-medium text-zinc-600 mb-1">Preset Name</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g., Midnight Supernova, Liquid Neon..."
                  className="w-full px-3 py-1.5 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900 placeholder-zinc-400 focus:outline-hidden focus:border-zinc-600"
                />
              </div>
              <div>
                <label className="block text-3xs font-medium text-zinc-600 mb-1">Notes / Description (Optional)</label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="e.g., Locked wave frequency with high friction"
                  className="w-full px-3 py-1.5 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900 placeholder-zinc-400 focus:outline-hidden focus:border-zinc-600"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-zinc-900 hover:bg-black text-white font-medium text-xs transition-colors shadow-2xs"
              >
                Confirm & Save
              </button>
            </div>
          </form>
        )}

        {/* Favorites List */}
        <div className="flex-1 p-5 overflow-y-auto space-y-2.5">
          {favorites.length === 0 ? (
            <div className="py-12 text-center text-zinc-400 space-y-3">
              <Bookmark className="w-10 h-10 mx-auto stroke-zinc-300" />
              <p className="text-xs">No saved favorites yet.</p>
              <button
                onClick={() => setIsCreating(true)}
                className="px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs border border-zinc-300 transition-colors"
              >
                Save Current Design
              </button>
            </div>
          ) : (
            favorites.map((fav) => {
              const isJustLoaded = justSavedId === fav.id;
              const dateStr = new Date(fav.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={fav.id}
                  id={`fav-card-${fav.id}`}
                  className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 rounded-xl bg-zinc-50/60 hover:bg-zinc-100/60 border border-zinc-200 transition-all gap-3"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Visual Color Palette Swatch */}
                    <div className="flex flex-col gap-0.5 p-1 rounded-md bg-white border border-zinc-200 shrink-0 shadow-2xs">
                      <div className="flex gap-0.5">
                        {fav.previewPalette.slice(0, 3).map((col, idx) => (
                          <div
                            key={idx}
                            className="w-3.5 h-3.5 rounded-xs"
                            style={{ backgroundColor: col }}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-semibold text-zinc-900 truncate">{fav.name}</h4>
                        <span className="px-1.5 py-0.2 rounded text-3xs uppercase tracking-wider font-mono bg-zinc-100 border border-zinc-200 text-zinc-600">
                          {fav.engine.replace('_', ' ')}
                        </span>
                      </div>

                      {fav.notes && (
                        <p className="text-3xs text-zinc-500 mt-0.5 truncate">{fav.notes}</p>
                      )}

                      <div className="flex items-center gap-3 text-3xs text-zinc-400 mt-1 font-mono">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {dateStr}
                        </span>
                        <span>•</span>
                        <span>{fav.variables.length} parameters</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center">
                    {/* Download single preset as JSON */}
                    <button
                      onClick={() => exportSingleAsJson(fav)}
                      className="p-1.5 rounded-lg bg-white hover:bg-zinc-100 border border-zinc-250 text-zinc-600 hover:text-zinc-900 transition-colors shadow-2xs"
                      title="Download JSON Project File"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => onDeleteFavorite(fav.id)}
                      className="p-1.5 rounded-lg bg-white hover:bg-red-50 border border-zinc-250 text-zinc-400 hover:text-red-600 transition-colors shadow-2xs"
                      title="Delete Favorite"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Load into Workspace */}
                    <button
                      onClick={() => handleLoad(fav)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        isJustLoaded
                          ? 'bg-emerald-600 text-white'
                          : 'bg-zinc-900 hover:bg-black text-white shadow-2xs'
                      }`}
                    >
                      {isJustLoaded ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Loaded</span>
                        </>
                      ) : (
                        <>
                          <span>Load Design</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-zinc-200 bg-zinc-50/50 text-3xs text-zinc-500 flex items-center justify-between">
          <span>{favorites.length} saved presets</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-zinc-100 border border-zinc-250 text-zinc-700 text-xs font-medium transition-colors shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
