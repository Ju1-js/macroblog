import { useParams } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
// useBlueskyAuth is no longer needed for fetching public data, but keep it if you plan to add authenticated actions on this page
// import { useBlueskyAuth } from './Auth/BlueskyAuthProvider'; 
import { fetchAtProtoProfile } from './ATProtoStuff/AccountDetailFetcher';
import { fetchMacroblogPosts, type MacroblogPost } from './ATProtoStuff/PostFetcher';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from 'react-router-dom';

function BlogPage() {
  const { handle } = useParams();
  // const { token } = useBlueskyAuth(); // Token no longer needed to fetch public posts/profiles
  const [posts, setPosts] = useState<MacroblogPost[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [postsError, setPostsError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  const [displayName, setDisplayName] = useState<string>("");
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchProfile = useCallback(async () => {
    if (!handle) return;

    try {
      setIsLoadingProfile(true);
      setProfileError(null);
      
      const profile = await fetchAtProtoProfile(handle);
      setDisplayName(profile.displayName || handle);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfileError(error instanceof Error ? error.message : 'Failed to fetch profile');
    } finally {
      setIsLoadingProfile(false);
    }
  }, [handle]);

  const fetchPosts = useCallback(async (loadMore = false) => {
    if (!handle) return;

    try {
      setIsLoadingPosts(true);
      setPostsError(null);

      const currentCursor = loadMore ? cursor : undefined;
      
      const result = await fetchMacroblogPosts(handle, {
        limit: 10,
        cursor: currentCursor
      });

      if (loadMore) {
        setPosts(prev => [...prev, ...result.posts]);
      } else {
        setPosts(result.posts);
      }

      setCursor(result.cursor);
      setHasMore(!!result.cursor);

    } catch (error) {
      console.error('Error fetching posts:', error);
      setPostsError(error instanceof Error ? error.message : 'Failed to fetch posts');
    } finally {
      setIsLoadingPosts(false);
    }
  }, [handle, cursor]); // token removed from dependency array

  // Fetch profile when handle changes
  useEffect(() => {
    if (handle) {
      fetchProfile();
    }
  }, [fetchProfile, handle]);

  // Fetch posts when component mounts or handle changes
  useEffect(() => {
    if (handle) {
      // Reset posts and cursor when handle changes
      setPosts([]);
      setCursor(undefined);
      setHasMore(true);
      fetchPosts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handle]); // fetchPosts is memoized and will be called only when the handle changes

  const loadMorePosts = () => {
    if (!isLoadingPosts && hasMore) {
      fetchPosts(true);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Unknown date';
    }
  };

  const handleLoadContent = (post: MacroblogPost) => {
    navigate(`/blog/post/${encodeURIComponent(post.uri)}`);
  };

  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Profile Not Found</h2>
          <p className="text-gray-600 mb-4">Could not load profile for @{handle}</p>
          <Button onClick={() => window.history.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">{displayName || `@${handle}`}</h1>
          <p className="text-gray-600">@{handle}</p>
        </div>

        {/* Posts Section */}
        <div className="max-w-4xl mx-auto">
          {postsError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <h3 className="text-red-800 font-semibold mb-2">Error Loading Posts</h3>
              <p className="text-red-600">{postsError}</p>
              <Button 
                onClick={() => fetchPosts()} 
                className="mt-2"
                variant="neutral"
              >
                Try Again
              </Button>
            </div>
          )}

          {posts.length === 0 && !isLoadingPosts && !postsError && (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Posts Found</h3>
              <p className="text-gray-500">This user hasn't published any macroblog posts yet.</p>
            </div>
          )}

          {/* Posts Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, index) => (
              <Card key={`${post.uri}-${index}`} className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleLoadContent(post)}
              >
                <CardHeader>
                  <CardTitle className="text-lg line-clamp-2">{post.value.title}</CardTitle>
                  <p className="text-sm text-gray-500">
                    {formatDate(post.value.createdAt)}
                  </p>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 line-clamp-4 mb-4">
                    {post.value.text}
                  </p>
                  {post.value.tags && post.value.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {post.value.tags.slice(0, 3).map((tag, tagIndex) => (
                        <span 
                          key={tagIndex}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                      {post.value.tags.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{post.value.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center mt-8">
              <Button 
                onClick={loadMorePosts}
                disabled={isLoadingPosts}
                variant="neutral"
                className="px-8"
              >
                {isLoadingPosts ? 'Loading...' : 'Load More Posts'}
              </Button>
            </div>
          )}

          {/* Loading Indicator */}
          {isLoadingPosts && posts.length > 0 && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-gray-600">Loading more posts...</p>
            </div>
          )}
        </div>
      </div>
      <div className="grid-bg"></div>
    </>
  );
}

export default BlogPage;