/**
 * HALO App Configuration
 */

export const CONFIG = {
  // App Info
  appName: 'HALO',
  appVersion: '1.0.0',
  
  // LiveKit Configuration
  livekit: {
    url: process.env.LIVEKIT_URL || '',
    apiKey: process.env.LIVEKIT_API_KEY || '',
    apiSecret: process.env.LIVEKIT_API_SECRET || '',
  },
  
  // Adult Mode Settings
  adultMode: {
    defaultEnabled: false,
    minAge: 18,
    requireAgeVerification: true,
  },
  
  // Stream Settings
  stream: {
    maxDuration: 7200, // 2 hours in seconds
    defaultQuality: 'auto',
    enableChat: true,
  },
  
  // Safety Settings
  safety: {
    enableReporting: true,
    enableBlocking: true,
    requireContentTagging: true,
  },
} as const;

export default CONFIG;
