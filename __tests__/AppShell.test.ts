import {
  accountActionsFor,
  initialAppSection,
  primaryNavigation,
  resolveRequestedSection,
} from '../src/appShell';

describe('NSCENE app shell', () => {
  it('opens on public Live browsing even when signed out', () => {
    expect(initialAppSection).toBe('live');
    expect(resolveRequestedSection('live', false)).toBe('live');
    expect(resolveRequestedSection('uploads', false)).toBe('uploads');
  });

  it('renders exactly the six canonical public destinations', () => {
    expect(primaryNavigation.map((item) => item.label)).toEqual([
      'LIVE',
      'UPLOADS',
      'CLIPS',
      'SHOWS',
      'CREATORS',
      'COMMUNITIES',
    ]);
  });

  it('offers Sign in but not Studio or Account when signed out', () => {
    expect(accountActionsFor(false)).toEqual([
      { id: 'signin', label: 'SIGN IN' },
    ]);
    expect(resolveRequestedSection('studio', false)).toBe('live');
    expect(resolveRequestedSection('account', false)).toBe('live');
  });

  it('offers Studio and Account from the authenticated account menu', () => {
    expect(accountActionsFor(true)).toEqual([
      { id: 'studio', label: 'STUDIO' },
      { id: 'account', label: 'ACCOUNT' },
    ]);
    expect(resolveRequestedSection('studio', true)).toBe('studio');
    expect(resolveRequestedSection('account', true)).toBe('account');
  });
});
