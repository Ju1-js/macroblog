import { BskyAgent } from '@atproto/api';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Initialize the Bluesky Agent
const agent = new BskyAgent({
  service: 'https://bsky.social',
});

// A function to log in the agent, with caching to avoid re-logging in on every request
let loginPromise: Promise<void> | null = null;
async function ensureLogin() {
  if (!loginPromise) {
    loginPromise = (async () => {
      try {
        console.log('Logging in with server-side account...');
        console.log('Using handle:', process.env.BSKY_HANDLE);
        console.log('Using password:', process.env.BSKY_APP_PASSWORD ? '******' : 'Not set');
        await agent.login({
          identifier: process.env.BSKY_HANDLE!,
          password: process.env.BSKY_APP_PASSWORD!,
        });
        console.log('Server-side login successful.');
      } catch (error) {
        console.error('Server-side login failed:', error);
        loginPromise = null; // Reset promise on failure to allow retries
        throw new Error('Server-side authentication failed');
      }
    })();
  }
  return loginPromise;
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  const { actor } = request.query;

  if (typeof actor !== 'string') {
    return response.status(400).json({ error: 'Actor parameter is required' });
  }

  try {
    // Ensure the server-side agent is logged in
    await ensureLogin();

    // Fetch the profile from Bluesky
    const { data } = await agent.getProfile({ actor });

    // Set caching headers for the response to reduce redundant API calls
    response.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate'); // Cache for 1 hour

    // Return the profile data
    return response.status(200).json(data);
  } catch (error) {
    console.error(`Error fetching profile for ${actor}:`, error);
    const statusCode = error instanceof Error && error.message.includes('Profile not found') ? 404 : 500;
    return response.status(statusCode).json({ error: `Failed to fetch profile for ${actor}` });
  }
}