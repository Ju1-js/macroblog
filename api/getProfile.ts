import { AtpAgent } from '@atproto/api';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  const { actor } = request.query;

  if (typeof actor !== 'string') {
    return response.status(400).json({ error: 'Actor parameter is required' });
  }

  try {
    // Use a fresh, unauthenticated agent for public data
    const agent = new AtpAgent({ service: 'https://bsky.social' });

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