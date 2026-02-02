import { AccessToken } from 'livekit-server-sdk';

/**
 * Generate LiveKit Stream Token
 * NOTE: This file should be executed on a backend server, not in the React Native app.
 * The livekit-server-sdk requires Node.js and should not be bundled with the client app.
 */
export const generateStreamToken = async (identity: string, roomName: string) => {
  // Validate required environment variables
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  
  if (!apiKey || !apiSecret) {
    throw new Error('Missing required environment variables: LIVEKIT_API_KEY and/or LIVEKIT_API_SECRET');
  }

  // Create a token with the LiveKit API Key and Secret stored in your .env
  const at = new AccessToken(
    apiKey,
    apiSecret,
    { identity }
  );

  // Set permissions: Creator can publish, Viewer can only subscribe
  at.addGrant({ 
    roomJoin: true, 
    room: roomName, 
    canPublish: true, 
    canSubscribe: true 
  });

  return at.toJwt();
};
