import type { VercelRequest, VercelResponse } from '@vercel/node';
import { agent, ensureAgentLogin } from './_lib/agent';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  const { uri } = request.query;

  if (typeof uri !== 'string' || !uri.startsWith('at://')) {
    return response.status(400).json({ error: 'A valid post URI is required' });
  }

  try {
    // Ensure the server-side agent is logged in
    await ensureAgentLogin();

    // Use getRecord for efficiency
    const getRecordResponse = await agent.api.com.atproto.repo.getRecord({
      repo: uri.split('/')[2], // Extract repo (DID) from URI
      collection: uri.split('/')[3],
      rkey: uri.split('/')[4],
    });

    // Set caching headers
    response.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate'); // Cache for 1 day

    return response.status(200).json(getRecordResponse.data);
  } catch (error) {
    console.error(`Error fetching single post with URI ${uri}:`, error);
    const statusCode = error instanceof Error && error.message.includes('Record not found') ? 404 : 500;
    return response.status(statusCode).json({ error: `Failed to fetch post: ${uri}` });
  }
}