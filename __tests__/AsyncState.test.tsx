import React from 'react';
import { AsyncState } from '../src/components/media/AsyncState';

const collectText = (node: React.ReactNode): string[] => {
  if (typeof node === 'string' || typeof node === 'number') return [String(node)];
  if (Array.isArray(node)) return node.flatMap(collectText);
  if (React.isValidElement(node)) {
    return collectText((node.props as { children?: React.ReactNode }).children);
  }
  return [];
};

describe('AsyncState', () => {
  it.each([
    ['loading', 'LOADING', 'Checking NSCENE for verified content.'],
    ['empty', 'NOTHING HERE YET', 'No verified content is available in this lane yet.'],
    ['unavailable', 'UNAVAILABLE', 'NSCENE data is not available from this deployment right now.'],
    ['error', 'COULD NOT LOAD', 'NSCENE could not load this content.'],
    ['not-found', 'NOT FOUND', 'The requested NSCENE record was not found.'],
  ] as const)('renders honest %s copy', (state, title, message) => {
    const output = AsyncState({ state });
    const text = collectText(output);
    expect(text).toContain(title);
    expect(text).toContain(message);
  });
});
