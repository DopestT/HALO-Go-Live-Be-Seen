import React from 'react';
import { DiscoveryFeed } from '../DiscoveryFeed';

// The canonical home surface is the wide, responsive discovery experience.
// Keeping this wrapper lets existing navigation routes converge on one layout
// instead of maintaining separate mobile-feed and streaming-grid designs.
export default function HomeScreen() {
  return <DiscoveryFeed />;
}
