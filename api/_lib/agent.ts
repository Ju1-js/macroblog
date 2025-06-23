import { AtpAgent } from '@atproto/api';

// Initialize a single, shared Bluesky Agent instance
export const agent = new AtpAgent({
  service: 'https://bsky.social',
});

// A cached promise to ensure we only try to log in once
let loginPromise: Promise<void> | null = null;

/**
 * Ensures the shared AtpAgent is logged in.
 * It uses a cached promise to prevent multiple login attempts during concurrent requests.
 */
export function ensureAgentLogin(): Promise<void> {
  if (!loginPromise) {
    loginPromise = (async () => {
      try {
        if (!process.env.BSKY_HANDLE || !process.env.BSKY_APP_PASSWORD) {
          throw new Error('Missing BSKY_HANDLE or BSKY_APP_PASSWORD environment variables.');
        }
        
        console.log('Logging in server-side agent...');
        await agent.login({
          identifier: process.env.BSKY_HANDLE,
          password: process.env.BSKY_APP_PASSWORD,
        });
        console.log('Server-side agent login successful.');
      } catch (error) {
        console.error('Server-side agent login failed:', error);
        // Reset promise on failure to allow the next request to retry
        loginPromise = null; 
        throw new Error('Server-side authentication failed');
      }
    })();
  }
  return loginPromise;
}