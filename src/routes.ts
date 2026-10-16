import type { PublicSection } from './product';

const publicRoutes: Record<PublicSection, string> = {
  live: '/live',
  uploads: '/uploads',
  clips: '/clips',
  shows: '/shows',
  creators: '/creators',
  communities: '/communities',
};

export const publicRouteFor = (section: PublicSection): string => publicRoutes[section];

const idRoute = (prefix: string, id: number): string => {
  if (!Number.isSafeInteger(id) || id < 1) {
    throw new Error(`Invalid route id: ${id}`);
  }
  return `${prefix}/${id}`;
};

export const watchRoute = (id: number): string => idRoute('/watch', id);
export const creatorRoute = (id: number): string => idRoute('/creator', id);

export const publicRouteMap = publicRoutes;
