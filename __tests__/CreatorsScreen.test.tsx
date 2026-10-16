import React from 'react';
import { AsyncState } from '../src/components/media/AsyncState';
import { CreatorCard } from '../src/components/creator/CreatorCard';
import { PublicApiError } from '../src/api/publicClient';
import type { PublicCreator } from '../src/api/types';
import {
  CreatorsView,
  creatorDirectoryStatusFromError,
  loadCreators,
} from '../src/screens/CreatorsScreen';

const creator: PublicCreator = {
  id: 7,
  username: 'creator7',
  display_name: 'Creator Seven',
  bio: 'Returned public bio',
  avatar_url: '',
};

const findElement = (node: React.ReactNode, type: unknown): React.ReactElement | undefined => {
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findElement(child, type);
      if (found) return found;
    }
    return undefined;
  }
  if (!React.isValidElement(node)) return undefined;
  if (node.type === type) return node;
  return findElement((node.props as { children?: React.ReactNode }).children, type);
};

describe('CreatorsScreen', () => {
  it('loads the public creator directory', async () => {
    const loader = jest.fn().mockResolvedValue([creator]);
    await expect(loadCreators(loader)).resolves.toEqual([creator]);
    expect(loader).toHaveBeenCalledWith({ limit: 40, offset: 0 });
  });

  it('renders returned creators and opens the returned creator id', () => {
    const onOpen = jest.fn();
    const output = CreatorsView({ status: 'ready', creators: [creator], onOpen });
    const card = findElement(output, CreatorCard);
    expect(card).toBeDefined();
    expect((card?.props as { creator: PublicCreator }).creator).toEqual(creator);
    (card?.props as { onOpen: (id: number) => void }).onOpen(7);
    expect(onOpen).toHaveBeenCalledWith(7);
  });

  it.each([
    ['loading', 'loading'],
    ['empty', 'empty'],
    ['unavailable', 'unavailable'],
    ['error', 'error'],
  ] as const)('renders %s state honestly', (status, expected) => {
    const state = findElement(CreatorsView({ status, creators: [], onOpen: jest.fn() }), AsyncState);
    expect((state?.props as { state: string }).state).toBe(expected);
  });

  it('maps configuration/network failures separately from generic failures', () => {
    expect(creatorDirectoryStatusFromError(new PublicApiError('not_configured', 'missing'))).toBe('unavailable');
    expect(creatorDirectoryStatusFromError(new PublicApiError('unavailable', 'down'))).toBe('unavailable');
    expect(creatorDirectoryStatusFromError(new Error('boom'))).toBe('error');
  });
});
