import React from 'react';
import { PublicLaneScreen } from '../src/screens/PublicLaneScreen';

const cases = [
  ['clips', 'CLIPS', 'Short clips will appear here when the verified clips feed is connected.'],
  ['shows', 'SHOWS', 'Series and episodic programming will appear here when the verified shows feed is connected.'],
  ['communities', 'COMMUNITIES', 'Community spaces will appear here when verified community data is connected.'],
] as const;

const collectText = (node: React.ReactNode): string[] => {
  if (typeof node === 'string' || typeof node === 'number') return [String(node)];
  if (Array.isArray(node)) return node.flatMap(collectText);
  if (React.isValidElement(node)) return collectText((node.props as { children?: React.ReactNode }).children);
  return [];
};

describe('PublicLaneScreen', () => {
  it.each(cases)('renders an honest empty state for %s', (section, label, copy) => {
    const output = PublicLaneScreen({ section });
    const text = collectText(output);

    expect(text).toContain(label);
    expect(text).toContain(copy);
    expect(text).toContain('NO FABRICATED ACTIVITY');
  });
});
