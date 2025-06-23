import axios from 'axios';

export interface AtProtoProfile {
  did: string;
  displayName: string;
  avatar: string;
  handle: string;
  description?: string;
  followersCount?: number;
  followsCount?: number;
  postsCount?: number;
}

export async function fetchAtProtoProfile(
  handle: string, 
): Promise<AtProtoProfile> {
  try {
    const response = await axios.get(
      `/api/getProfile?actor=${encodeURIComponent(handle)}`
    );

    const { did, displayName, avatar, handle: userHandle, description, followersCount, followsCount, postsCount } = response.data;
    
    return { 
      did, 
      displayName: displayName || userHandle, 
      avatar: avatar || '', 
      handle: userHandle,
      description,
      followersCount,
      followsCount,
      postsCount
    };
  } catch (error) {
    console.error('Error fetching profile through serverless proxy:', error);
    let errorMessage = `Failed to fetch profile for ${handle}`;
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      errorMessage = `User not found: ${handle}`;
    }
    throw new Error(errorMessage);
  }
}