import React, { useEffect, useState } from 'react';
import { listVideos, PublicApiError } from '../api/publicClient';
import type { VideoWithEngagement } from '../api/types';
import { AsyncState } from '../components/media/AsyncState';
import { MediaGrid } from '../components/media/MediaGrid';
import type { PublicSection } from '../product';
import { DiscoveryShowcase } from '../components/DiscoveryShowcase';

export type LaneStatus = 'loading' | 'ready' | 'empty' | 'unavailable' | 'error';
export type VideoLoader = typeof listVideos;

export const laneStatusFromError = (error: unknown): LaneStatus =>
  error instanceof PublicApiError && (error.code === 'not_configured' || error.code === 'unavailable')
    ? 'unavailable'
    : 'error';

export const loadLiveVideos = (loader: VideoLoader = listVideos) => loader({ live: true });

export const DiscoveryFeedView = ({
  status,
  videos,
  onOpen,
}: {
  status: LaneStatus;
  videos: VideoWithEngagement[];
  onOpen: (videoId: number) => void;
}) => {
  return status === 'ready' ? <MediaGrid videos={videos} onOpen={onOpen} /> : <AsyncState state={status} compact />;
};

export const DiscoveryFeed: React.FC<{ onOpen: (videoId: number) => void; onSection?: (section: PublicSection) => void }> = ({ onOpen, onSection }) => {
  const [status, setStatus] = useState<LaneStatus>('loading');
  const [videos, setVideos] = useState<VideoWithEngagement[]>([]);

  useEffect(() => {
    let active = true;
    setStatus('loading');
    loadLiveVideos()
      .then((records) => {
        if (!active) return;
        setVideos(records);
        setStatus(records.length === 0 ? 'empty' : 'ready');
      })
      .catch((error: unknown) => {
        if (!active) return;
        setVideos([]);
        setStatus(laneStatusFromError(error));
      });
    return () => {
      active = false;
    };
  }, []);

  return <DiscoveryShowcase previewLive={status !== 'ready' && status !== 'loading'} onSection={onSection}><DiscoveryFeedView status={status} videos={videos} onOpen={onOpen} /></DiscoveryShowcase>;
};
