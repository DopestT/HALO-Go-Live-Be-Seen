import React from 'react';
import { render } from '@testing-library/react-native';
import { PublicLaneScreen } from '../src/screens/PublicLaneScreen';

const cases = [
  ['uploads', 'UPLOADS', 'Long-form and uploaded video will appear here when the verified media feed is connected.'],
  ['clips', 'CLIPS', 'Short clips will appear here when the verified clips feed is connected.'],
  ['shows', 'SHOWS', 'Series and episodic programming will appear here when the verified shows feed is connected.'],
  ['creators', 'CREATORS', 'Creator discovery will appear here when verified creator profiles are connected.'],
  ['communities', 'COMMUNITIES', 'Community spaces will appear here when verified community data is connected.'],
] as const;

describe('PublicLaneScreen', () => {
  it.each(cases)('renders an honest empty state for %s', (section, label, copy) => {
    const screen = render(<PublicLaneScreen section={section} />);

    expect(screen.getByText(label)).toBeTruthy();
    expect(screen.getByText(copy)).toBeTruthy();
    expect(screen.getByText('NO FABRICATED ACTIVITY')).toBeTruthy();
  });
});
