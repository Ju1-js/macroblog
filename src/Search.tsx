import './App.css'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useEffect, useState, useCallback } from "react";
// import { useBlueskyAuth } from './Auth/BlueskyAuthProvider';
import { fetchAtProtoProfile } from './ATProtoStuff/AccountDetailFetcher';
import { useNavigate } from 'react-router-dom';

interface HandleProp {
  handle: string;
}

// Blog Search Page Component
function SearchPage() {
  // const { token } = useBlueskyAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ handle: string; displayName: string; avatar?: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Default featured users
  const featuredUsers = [
    { handle: "samarinara.bsky.social", displayName: "Samarinara" }, 
    { handle: "dame.is", displayName: "dummy" },
    { handle: "dysonsphere42.bsky.social", displayName: "Dysonsphere" }, // This will be fetched by ProfileCard
  ];

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      // For now, we'll do a simple search by trying to fetch the profile
      // In a real implementation, you might want to use a search API
      const query = searchQuery.trim();
      
      // If it looks like a handle, try to fetch the profile
      if (query.includes('.') || query.startsWith('@')) {
        const handle = query.startsWith('@') ? query.slice(1) : query;
        // The options object with the access token is no longer needed
        const profile = await fetchAtProtoProfile(handle);
        
        setSearchResults([{
          handle: profile.did, // Use did here for a more stable key if available
          displayName: profile.displayName || handle,
          avatar: profile.avatar
        }]);
      } else {
        // For now, just show the featured users if no specific handle
        setSearchResults(featuredUsers);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchError('User not found or search failed');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4x2 font-bold mb-4">Search Blogs</h1>          
          {/* Search Input */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="flex gap-2">
              <Input 
                className="flex-1"
                placeholder="Search for users (e.g., alice.bsky.social)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyPress}
              />
              <Button 
                onClick={handleSearch}
                disabled={isSearching}
              >
                {isSearching ? 'Searching...' : 'Search'}
              </Button>
            </div>
            
            {searchError && (
              <p className="text-red-600 text-sm mt-2">{searchError}</p>
            )}
          </div>
        </div>

        {/* Search Results or Featured Users */}
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-semibold mb-6 text-center">
            {searchQuery ? 'Search Results' : 'Featured Blogs'}
          </h2>
          
          {isSearching && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p>Searching...</p>
            </div>
          )}

          {!isSearching && searchResults.length === 0 && searchQuery && (
            <div className="text-center py-8">
              <p className="text-gray-600">No users found for "{searchQuery}"</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {(searchQuery ? searchResults : featuredUsers).map((user) => ( // Use featuredUsers directly here
              <ProfileCard key={user.handle} handle={user.handle} />
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="text-center mt-8">
          <Button onClick={() => window.location.href = '/home'} variant="neutral">
            Back to Home
          </Button>
        </div>
      </div>
      <div className="grid-bg"></div>
    </>
  );
}

function ProfileCard({handle}: HandleProp) {
  const navigate = useNavigate();
  // const { token } = useBlueskyAuth();
  const [displayName, setDisplayName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetchProfile = useCallback(async () => {
    if (!handle) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const profile = await fetchAtProtoProfile(handle);
      setDisplayName(profile.displayName || handle);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch profile');
    } finally {
      setIsLoading(false);
    }
  }, [handle]);

  useEffect(() => {
    if (handle) {
      fetchProfile();
    }
  }, [fetchProfile, handle]);

  const handleLoadContent = (handle: string) => {
    navigate(`/blog/${handle}`);
  };

  return (
    <Button 
      className="flex flex-col items-center justify-center h-48 w-full p-4 hover:shadow-lg transition-all duration-200 rounded-lg border border-gray-200 hover:border-blue-300"
      onClick={() => handleLoadContent(handle)}
      disabled={isLoading}
    >
      <div className="flex flex-col items-center gap-3">
        <ProfilePicture handle={handle} />
        <div className="text-center">
          {isLoading ? (
            <div className="animate-pulse bg-gray-200 h-4 w-24 rounded"></div>
          ) : error ? (
            <span className="text-red-500 text-sm">Error loading</span>
          ) : (
            <h3 className="font-semibold text-sm line-clamp-2">
              {displayName || `@${handle}`}
            </h3>
          )}
          <p className="text-xs text-gray-500 mt-1">@{handle}</p>
        </div>
      </div>
    </Button>
  );
}

export function ProfilePicture({handle}: HandleProp) {
  // const { token } = useBlueskyAuth();
  const [avatar, setAvatar] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetchAvatar = useCallback(async () => {
    if (!handle) return;
  
    try {
      setIsLoading(true);
      setError(null);
      
      const profile = await fetchAtProtoProfile(handle);
      setAvatar(profile.avatar || "");
    } catch (error) {
      console.error('Error fetching avatar:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch avatar');
    } finally {
      setIsLoading(false);
    }
  }, [handle]);

  useEffect(() => {
    if (handle) {
      fetchAvatar();
    }
  }, [fetchAvatar, handle]);

  return (
    <div className='w-16 h-16 rounded-full overflow-hidden flex items-center justify-center bg-gray-200 border-2 border-gray-300'>
      {isLoading ? (
        <div className="animate-pulse bg-gray-300 w-full h-full"></div>
      ) : error ? (
        <span className="text-gray-400 text-xs">Error</span>
      ) : avatar ? (
        <img
          src={avatar}
          alt="Profile"
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.classList.remove('hidden');
          }}
        />
      ) : (
        <span className="text-gray-400 text-xs">No Image</span>
      )}
    </div>
  );
}

export default SearchPage;