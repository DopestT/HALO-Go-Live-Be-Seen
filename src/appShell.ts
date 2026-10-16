import { PublicSection, publicSections } from './product';
import { publicRouteFor } from './routes';

export type ProtectedSection = 'signin' | 'studio' | 'account';
export type AppSection = PublicSection | ProtectedSection;

export const initialAppSection: AppSection = 'live';
export const initialAppPath = publicRouteFor('live');
export const primaryNavigation = publicSections;

export const accountActionsFor = (isAuthenticated: boolean) => (
  isAuthenticated
    ? [
        { id: 'studio' as const, label: 'STUDIO' as const },
        { id: 'account' as const, label: 'ACCOUNT' as const },
      ]
    : [{ id: 'signin' as const, label: 'SIGN IN' as const }]
);

export const resolveRequestedSection = (
  requested: AppSection,
  isAuthenticated: boolean,
): AppSection => {
  if (!isAuthenticated && (requested === 'studio' || requested === 'account')) {
    return 'live';
  }

  if (isAuthenticated && requested === 'signin') {
    return 'account';
  }

  return requested;
};
