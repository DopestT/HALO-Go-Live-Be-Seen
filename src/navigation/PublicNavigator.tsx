import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import type { ProtectedSection } from '../appShell';
import type { PublicSection } from '../product';
import { creatorRoute, publicRouteFor, watchRoute } from '../routes';

export type PublicAppRoute =
  | { kind: 'section'; section: PublicSection }
  | { kind: 'watch'; id: number }
  | { kind: 'creator'; id: number }
  | { kind: 'search'; query: string }
  | { kind: 'protected'; section: ProtectedSection }
  | { kind: 'not-found' };

const publicPathSections: Record<string, PublicSection> = {
  '/live': 'live',
  '/uploads': 'uploads',
  '/clips': 'clips',
  '/shows': 'shows',
  '/creators': 'creators',
  '/communities': 'communities',
};

const protectedPathSections: Record<string, ProtectedSection> = {
  '/signin': 'signin',
  '/studio': 'studio',
  '/account': 'account',
};

const normalizePath = (path: string): string => {
  const pathname = path.split(/[?#]/, 1)[0] || '/';
  if (pathname === '/') return '/live';
  return pathname.length > 1 && pathname.endsWith('/')
    ? pathname.slice(0, -1)
    : pathname;
};

const searchQueryFromPath = (path: string): string => {
  const withoutHash = path.split('#', 1)[0];
  const queryIndex = withoutHash.indexOf('?');
  if (queryIndex === -1) return '';
  return new URLSearchParams(withoutHash.slice(queryIndex + 1)).get('q') ?? '';
};

const parseDetailId = (path: string, prefix: string): number | null => {
  if (!path.startsWith(`${prefix}/`)) return null;
  const raw = path.slice(prefix.length + 1);
  if (!/^\d+$/.test(raw)) return null;
  const id = Number(raw);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

export const parsePublicPath = (path: string): PublicAppRoute => {
  const normalized = normalizePath(path);

  const publicSection = publicPathSections[normalized];
  if (publicSection) {
    return { kind: 'section', section: publicSection };
  }

  const protectedSection = protectedPathSections[normalized];
  if (protectedSection) {
    return { kind: 'protected', section: protectedSection };
  }

  if (normalized === '/search') {
    return { kind: 'search', query: searchQueryFromPath(path) };
  }

  const watchId = parseDetailId(normalized, '/watch');
  if (watchId !== null) {
    return { kind: 'watch', id: watchId };
  }

  const creatorId = parseDetailId(normalized, '/creator');
  if (creatorId !== null) {
    return { kind: 'creator', id: creatorId };
  }

  return { kind: 'not-found' };
};

export const routePath = (route: Exclude<PublicAppRoute, { kind: 'not-found' }>): string => {
  switch (route.kind) {
    case 'section':
      return publicRouteFor(route.section);
    case 'watch':
      return watchRoute(route.id);
    case 'creator':
      return creatorRoute(route.id);
    case 'search': {
      const query = route.query.trim();
      return query ? `/search?q=${encodeURIComponent(query)}` : '/search';
    }
    case 'protected':
      return `/${route.section}`;
  }
};

type BrowserLike = {
  location: { pathname: string; search?: string };
  history: { pushState: (state: unknown, title: string, url?: string | null) => void };
  addEventListener: (type: string, listener: () => void) => void;
  removeEventListener: (type: string, listener: () => void) => void;
};

const getBrowser = (): BrowserLike | undefined => {
  if (Platform.OS !== 'web') return undefined;
  return (globalThis as unknown as { window?: BrowserLike }).window;
};

const browserPath = (browser: BrowserLike): string =>
  `${browser.location.pathname}${browser.location.search ?? ''}`;

export const usePublicNavigation = () => {
  const browser = getBrowser();
  const [route, setRoute] = useState<PublicAppRoute>(() =>
    parsePublicPath(browser ? browserPath(browser) : '/live'),
  );

  useEffect(() => {
    if (!browser) return undefined;

    const handlePopState = () => setRoute(parsePublicPath(browserPath(browser)));
    browser.addEventListener('popstate', handlePopState);
    return () => browser.removeEventListener('popstate', handlePopState);
  }, [browser]);

  const navigate = useCallback((next: Exclude<PublicAppRoute, { kind: 'not-found' }>) => {
    const path = routePath(next);
    if (browser && browserPath(browser) !== path) {
      browser.history.pushState({}, '', path);
    }
    setRoute(next);
  }, [browser]);

  return { route, navigate };
};