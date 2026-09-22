import { createRouter } from '@tanstack/react-router';
import { Route as rootRoute } from './routes/__root';
import { Route as indexRoute } from './routes/index';
import { Route as presetsRoute } from './routes/presets';
import { Route as favoritesRoute } from './routes/favorites';
import { queryClient } from './lib/queryClient';

const routeTree = rootRoute.addChildren([
  indexRoute,
  presetsRoute,
  favoritesRoute,
]);

export const router = createRouter({
  routeTree,
  context: {
    queryClient,
  },
  defaultPreload: 'intent',
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
