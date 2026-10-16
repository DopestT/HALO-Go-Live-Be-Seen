export const productIdentity = {
  name: 'NSCENE',
  tagline: 'See It. Share It. Live It.',
  motto: 'Built to amplify, not manipulate.',
  domain: 'nscene.watch',
} as const;

export const publicSections = [
  { id: 'live', label: 'LIVE' },
  { id: 'uploads', label: 'UPLOADS' },
  { id: 'clips', label: 'CLIPS' },
  { id: 'shows', label: 'SHOWS' },
  { id: 'creators', label: 'CREATORS' },
  { id: 'communities', label: 'COMMUNITIES' },
] as const;

export type PublicSection = (typeof publicSections)[number]['id'];

export const isPublicSection = (value: string): value is PublicSection =>
  publicSections.some((section) => section.id === value);
