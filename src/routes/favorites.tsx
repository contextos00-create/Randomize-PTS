import React, { useState, useEffect } from 'react';
import { createRoute, useNavigate } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import { SavedConfiguration } from '../types';
import { DEFAULT_PRESET_FAVORITES, ENGINE_PRESETS } from '../engines/presets';
import {
  Bookmark,
  Sparkles,
  ArrowRight,
  Trash2,
  Download,
  Calendar,
  Layers,
} from 'lucide-react';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/favorites',
  component: FavoritesPage,
});

function FavoritesPage() {
  const navigate = useNavigate();
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
        JSON.stringify(ENGINE_PRESETS[fav.engine]?.defaultVariables || [])
      ),
    }));
  });

  const handleDeleteFavorite = (id: string) => {
    const updated = favorites.filter((f) => f.id !== id);
    setFavorites(updated);
    try {
      localStorage.setItem('pts_randomizer_favorites', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleLaunchFavorite = (fav: SavedConfiguration) => {
    // Store as active favorite for studio to load
    try {
      sessionStorage.setItem('pts_pending_load_favorite', JSON.stringify(fav));
    } catch (e) {
      console.error(e);
    }
    navigate({
      to: '/',
      search: (prev: any) => ({
        ...prev,
        engine: fav.engine,
      }),
    });
  };

  const handleExportJson = (fav: SavedConfiguration) => {
    const jsonStr = JSON.stringify(fav, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pts-favorite-${fav.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full w-full overflow-y-auto p-4 sm:p-6 lg:p-8 bg-zinc-50/70">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-amber-500" />
              <span>Saved Configurations & Favorites</span>
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Review and launch your favorite randomized parameter compositions.
            </p>
          </div>
          <span className="self-start sm:self-auto px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-zinc-100 border border-zinc-250 text-zinc-700">
            {favorites.length} Saved Profiles
          </span>
        </div>

        {favorites.length === 0 ? (
          <div className="text-center py-16 bg-white border border-dashed border-zinc-250 rounded-2xl p-8 space-y-3">
            <Bookmark className="w-10 h-10 text-zinc-300 mx-auto" />
            <h3 className="text-sm font-semibold text-zinc-800">No saved favorites yet</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Whenever you create a generative composition you love in the Studio, click "Favorites" to save it for later use.
            </p>
            <button
              onClick={() => navigate({ to: '/' })}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-black text-white text-xs font-medium transition-colors"
            >
              <span>Go to Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {favorites.map((fav) => {
              const formattedDate = new Date(fav.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              return (
                <div
                  key={fav.id}
                  className="bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-zinc-350 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {fav.previewPalette?.map((c, i) => (
                          <span
                            key={i}
                            className="w-4 h-4 rounded-full border border-zinc-200 shadow-2xs"
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                      <span className="text-4xs font-mono px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">
                        {fav.engine}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-zinc-900">{fav.name}</h3>
                      {fav.notes && (
                        <p className="text-xs text-zinc-500 mt-1 italic line-clamp-2">
                          "{fav.notes}"
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-4xs font-mono text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formattedDate}
                      </span>
                      <span>{fav.variables?.length || 0} variables</span>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-zinc-100 flex items-center gap-2">
                    <button
                      onClick={() => handleLaunchFavorite(fav)}
                      className="flex-1 py-1.5 px-3 rounded-xl bg-zinc-900 hover:bg-black text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs"
                    >
                      <span>Load</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleExportJson(fav)}
                      className="p-1.5 rounded-xl border border-zinc-200 hover:bg-zinc-100 text-zinc-600 transition-colors"
                      title="Export JSON"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteFavorite(fav.id)}
                      className="p-1.5 rounded-xl border border-zinc-200 hover:bg-red-50 hover:border-red-200 text-zinc-400 hover:text-red-600 transition-colors"
                      title="Delete Favorite"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
