import type { VercelRequest, VercelResponse } from '@vercel/node';
import { agent, ensureAgentLogin } from './_lib/agent.js';

const MACROBLOG_COLLECTION = 'com.macroblog.blog.post';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  const { repo, limit = '20', cursor } = request.query;

  if (typeof repo !== 'string') {
    return response.status(400).json({ error: 'Repo parameter (handle or DID) is required' });
  }

  try {
    // Ensure the server-side agent is logged in
    await ensureAgentLogin();

    // Fetch the records from the specified repository
    const listRecordsResponse = await agent.api.com.atproto.repo.listRecords({
      repo,
      collection: MACROBLOG_COLLECTION,
      limit: parseInt(limit as string, 10),
      cursor: cursor as string | undefined,
    });

    // Set caching headers
    response.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate'); // Cache for 10 minutes

    // Return the records and the cursor
    return response.status(200).json(listRecordsResponse.data);
  } catch (error) {
    console.error(`Error fetching posts for ${repo}:`, error);
    return response.status(500).json({ error: `Failed to fetch posts for ${repo}` });
  }
}