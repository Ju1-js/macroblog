import axios from 'axios';

// Interfaces remain the same
export interface MacroblogPost {
  uri: string;
  cid: string;
  value: MacroblogPostLex;
}

export interface MacroblogPostLex {
  title: string;
  text: string;
  tags?: string[];
  createdAt: string;
}

// A simpler options interface, as the access token is no longer needed
export interface PostFetchOptions {
  limit?: number;
  cursor?: string;
}

/**
 * Fetches a list of macroblog posts from a user via the server-side proxy.
 */
export async function fetchMacroblogPosts(
  handleOrDid: string, 
  options: PostFetchOptions = {}
): Promise<{ posts: MacroblogPost[]; cursor?: string }> {
  try {
    const response = await axios.get('/api/getPosts', {
      params: {
        repo: handleOrDid,
        limit: options.limit || 20,
        cursor: options.cursor,
      },
    });

    const { records: fetchedRecords, cursor: nextCursor } = response.data;

    // Transform and validate the records, ensuring they match the expected structure
    const validPosts: MacroblogPost[] = fetchedRecords
      .filter((record: any) => record.value && record.value.title && record.value.text)
      .map((record: any) => ({
        uri: record.uri,
        cid: record.cid,
        value: {
          title: record.value.title,
          text: record.value.text,
          tags: record.value.tags || [],
          createdAt: record.value.createdAt || new Date().toISOString(),
        },
      }));

    return {
      posts: validPosts,
      cursor: nextCursor,
    };
  } catch (error) {
    console.error('Error fetching macroblog posts:', error);
    throw new Error(`Failed to fetch posts: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Fetches a single macroblog post by its URI via the server-side proxy.
 */
export async function fetchMacroblogPost(
  uri: string, 
): Promise<MacroblogPost> {
  try {
    // The request now goes to your dedicated serverless function
    const response = await axios.get('/api/getPost', {
      params: { uri },
    });

    const { value, cid } = response.data;

    // The server returns the record directly, so we just format it
    return {
      uri,
      cid,
      value: {
        title: value.title,
        text: value.text,
        tags: value.tags || [],
        createdAt: value.createdAt || new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error('Error fetching single macroblog post:', error);
     if (axios.isAxiosError(error) && error.response?.status === 404) {
      throw new Error(`Post not found with URI: ${uri}`);
    }
    throw new Error(`Failed to fetch post: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}