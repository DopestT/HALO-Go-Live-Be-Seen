import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Stream {
  id: string;
  hostId: string;
  hostName: string;
  title: string;
  isAdultContent: boolean;
  viewerCount: number;
  isLive: boolean;
}

interface StreamContextType {
  activeStream: Stream | null;
  isStreaming: boolean;
  startStream: (title: string, isAdultContent: boolean) => Promise<void>;
  endStream: () => Promise<void>;
  joinStream: (streamId: string) => Promise<void>;
  leaveStream: () => void;
  reportStream: (streamId: string, reason: string) => Promise<void>;
  blockUser: (userId: string) => Promise<void>;
}

const StreamContext = createContext<StreamContextType | undefined>(undefined);

export const StreamProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeStream, setActiveStream] = useState<Stream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const startStream = async (title: string, isAdultContent: boolean) => {
    // TODO: Implement LiveKit stream start logic
    // SAFETY: Must include reference to Report and Block utility
    console.log('Starting stream:', title, 'Adult content:', isAdultContent);
    setIsStreaming(true);
  };

  const endStream = async () => {
    // TODO: Implement stream end logic
    setIsStreaming(false);
    setActiveStream(null);
  };

  const joinStream = async (streamId: string) => {
    // TODO: Implement join stream logic
    // Must use filterContentForUser to ensure 18+ content is gated
    console.log('Joining stream:', streamId);
  };

  const leaveStream = () => {
    setActiveStream(null);
  };

  const reportStream = async (streamId: string, reason: string) => {
    // SAFETY: Report utility reference
    console.log('Reporting stream:', streamId, 'Reason:', reason);
    // TODO: Implement reporting logic
  };

  const blockUser = async (userId: string) => {
    // SAFETY: Block utility reference
    console.log('Blocking user:', userId);
    // TODO: Implement blocking logic
  };

  const value: StreamContextType = {
    activeStream,
    isStreaming,
    startStream,
    endStream,
    joinStream,
    leaveStream,
    reportStream,
    blockUser,
  };

  return <StreamContext.Provider value={value}>{children}</StreamContext.Provider>;
};

export const useStream = () => {
  const context = useContext(StreamContext);
  if (context === undefined) {
    throw new Error('useStream must be used within a StreamProvider');
  }
  return context;
};

export default StreamContext;
