import React from 'react';
import { createRoute } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import { StudioWorkspace } from '../components/StudioWorkspace';
import { EngineType } from '../types';

interface StudioSearchParams {
  engine?: EngineType | 'custom_code';
  tab?: 'physics' | 'function' | 'look' | 'behavior' | 'all';
  intensity?: 'gentle' | 'balanced' | 'wild';
  drawer?: 'code' | 'layers' | 'none';
}

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  validateSearch: (search: Record<string, unknown>): StudioSearchParams => {
    return {
      engine: (search.engine as any) || undefined,
      tab: (search.tab as any) || undefined,
      intensity: (search.intensity as any) || undefined,
      drawer: (search.drawer as any) || undefined,
    };
  },
  component: StudioRouteComponent,
});

function StudioRouteComponent() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const handleUpdateSearch = (updates: Partial<StudioSearchParams>) => {
    navigate({
      search: (prev) => ({
        ...prev,
        ...updates,
      }),
      replace: true,
    });
  };

  return (
    <StudioWorkspace
      initialEngine={search.engine}
      initialTab={search.tab}
      initialIntensity={search.intensity}
      initialDrawer={search.drawer}
      onUpdateSearch={handleUpdateSearch}
    />
  );
}
