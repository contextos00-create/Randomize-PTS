import React from 'react';
import { createRootRouteWithContext, Link, Outlet, useRouterState } from '@tanstack/react-router';
import { QueryClient } from '@tanstack/react-query';
import {
  Sparkles,
  Layers,
  Bookmark,
  LayoutGrid,
  Sliders,
  Bot,
  ExternalLink,
} from 'lucide-react';

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});

function RootComponent() {
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;

  return (
    <div className="flex flex-col h-screen w-screen bg-zinc-100/90 text-zinc-900 overflow-hidden font-sans select-none antialiased">
      {/* Top Application Navbar: Atelier Gallery White */}
      <header
        id="app-header"
        className="flex items-center justify-between px-4 py-2.5 bg-white/95 backdrop-blur-md border-b border-zinc-200/90 z-20 shrink-0 shadow-2xs"
      >
        <div className="flex items-center gap-4">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-zinc-900 flex items-center justify-center shadow-xs transition-transform group-hover:scale-105">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold tracking-tight text-zinc-900">
                  Pts.js Randomizer
                </span>
                <span className="px-1.5 py-0.2 rounded text-4xs font-mono font-medium uppercase bg-zinc-100 text-zinc-700 border border-zinc-250">
                  TanStack Start
                </span>
              </div>
              <p className="text-4xs text-zinc-500 hidden sm:block">
                Dynamic Parameter Architecture & Multi-Layer Canvas
              </p>
            </div>
          </Link>

          <div className="w-px h-5 bg-zinc-200 hidden sm:block"></div>

          {/* TanStack Router Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-zinc-100 p-0.5 rounded-lg border border-zinc-200/80">
            <Link
              to="/"
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                pathname === '/'
                  ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Studio</span>
            </Link>

            <Link
              to="/presets"
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                pathname === '/presets'
                  ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Presets</span>
            </Link>

            <Link
              to="/favorites"
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                pathname === '/favorites'
                  ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5 text-amber-500" />
              <span>Favorites</span>
            </Link>
          </nav>
        </div>

        {/* Right Info Pill */}
        <div className="flex items-center gap-2 text-3xs font-mono text-zinc-500">
          <span className="hidden md:inline px-2 py-0.5 rounded-full bg-zinc-100 border border-zinc-200">
            Node v22 • Vite 8 • React 19
          </span>
        </div>
      </header>

      {/* Main Outlet for TanStack Router Child Routes */}
      <div className="flex-1 overflow-hidden relative">
        <Outlet />
      </div>
    </div>
  );
}
