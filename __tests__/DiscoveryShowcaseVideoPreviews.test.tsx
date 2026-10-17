import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('../src/components/NewsDesk', () => ({
  NewsDesk: () => null,
}));

import { DiscoveryShowcase } from '../src/components/DiscoveryShowcase';

describe('DiscoveryShowcase topic video previews', () => {
  it('renders preview media as accessible video cards', () => {
    const { getByLabelText } = render(
      <DiscoveryShowcase previewLive>
        <></>
      </DiscoveryShowcase>,
    );

    expect(getByLabelText('Preview video: Morning Vibes')).toBeTruthy();
  });
});
