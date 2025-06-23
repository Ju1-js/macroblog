import type { VercelRequest, VercelResponse } from '@vercel/node';
import { AtpAgent } from '@atproto/api';

const MACROBLOG_COLLECTION = 'com.macroblog.blog.post';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  const { repo: repoIdentifier, limit = '20', cursor } = request.query;

  if (typeof repoIdentifier !== 'string') {
    return response.status(400).json({ error: 'Repo parameter (handle or DID) is required' });
  }

  try {
    // For fetching posts, we need an authenticated agent
    const agent = new AtpAgent({ service: 'https://bsky.social' });
    await agent.login({
      identifier: process.env.BLUESKY_HANDLE!,
      password: process.env.BLUESKY_APP_PASSWORD!,
    });

    let repoDid = repoIdentifier;
    // If the identifier is a handle, resolve it to a DID first.
    if (!repoIdentifier.startsWith('did:')) {
      const resolveHandleResponse = await agent.resolveHandle({ handle: repoIdentifier });
      repoDid = resolveHandleResponse.data.did;
    }

    // Fetch the records from the specified repository
    const listRecordsResponse = await agent.api.com.atproto.repo.listRecords({
      repo: repoDid,
      collection: MACROBLOG_COLLECTION,
      limit: parseInt(limit as string, 10),
      cursor: cursor as string | undefined,
    });

    response.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate'); // Cache for 10 minutes
    return response.status(200).json(listRecordsResponse.data);
  } catch (error) {
    console.error(`Error fetching posts for ${repoIdentifier}:`, error);
    return response.status(500).json({ error: `Failed to fetch posts for ${repoIdentifier}` });
  }
}