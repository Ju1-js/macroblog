import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { fetchMacroblogPost, type MacroblogPost } from './ATProtoStuff/PostFetcher';
import { fetchAtProtoProfile, type AtProtoProfile } from './ATProtoStuff/AccountDetailFetcher';
// import { useBlueskyAuth } from './Auth/BlueskyAuthProvider'; // No longer needed
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import './post.css';

export default function PostPage() {
    // The URI contains the handle/DID, so we only need that from the params
    const { uri } = useParams<{ uri: string }>();
    const navigate = useNavigate();
    
    const [post, setPost] = useState<MacroblogPost | null>(null);
    const [author, setAuthor] = useState<AtProtoProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPostData = async () => {
            if (!uri) {
                setError('Missing post information (URI)');
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                setError(null);

                const decodedUri = decodeURIComponent(uri);

                // Fetch the post data.
                const postData = await fetchMacroblogPost(decodedUri);
                setPost(postData);

                // Extract the author's handle/DID from the post's URI
                // URI format: at://<did>/<collection>/<rkey>
                const authorDid = decodedUri.split('/')[2];
                if (!authorDid) {
                    throw new Error("Could not extract author's DID from post URI.");
                }

                // Fetch the author's profile.
                const authorProfile = await fetchAtProtoProfile(authorDid);
                setAuthor(authorProfile);

            } catch (err) {
                console.error('Error fetching post data:', err);
                setError(err instanceof Error ? err.message : 'Failed to load post');
            } finally {
                setIsLoading(false);
            }
        };

        fetchPostData();
    }, [uri]);

    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return 'Unknown date';
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p>Loading post...</p>
                </div>
            </div>
        );
    }

    if (error || !post || !author) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Post Not Found</h2>
                    <p className="text-gray-600 mb-4">{error || 'Could not load the requested post or author details.'}</p>
                    <Button onClick={() => navigate(-1)}>Go Back</Button>
                </div>
            </div>
        );
    }

    return (
        <>
        <div className="min-h-screen py-8">
            <div className="container mx-auto px-4">
                <div className="flex gap-8 justify-center">
                    {/* Left Sidebar Card - Post Metadata */}
                    <div className="w-80 flex-shrink-0">
                        <Card className="sticky top-8">
                            <CardHeader>
                                <CardTitle className="text-xl font-bold mb-2">
                                    {post.value.title}
                                </CardTitle>
                                
                                {/* Author Info */}
                                <div className="flex items-center gap-3 mb-4">
                                    <img 
                                        src={author.avatar || '/default-avatar.png'} 
                                        alt={author.displayName}
                                        className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                                        onError={(e) => {
                                            e.currentTarget.src = 'https://via.placeholder.com/48x48/6B7280/FFFFFF?text=U';
                                        }}
                                    />
                                    <div>
                                        <p className="font-semibold text-gray-900">{author.displayName}</p>
                                        <p className="text-sm text-gray-600">@{author.handle}</p>
                                    </div>
                                </div>

                                {/* Post Date */}
                                <p className="text-sm text-gray-500 mb-4">
                                    {formatDate(post.value.createdAt)}
                                </p>

                                {/* Tags */}
                                {post.value.tags && post.value.tags.length > 0 && (
                                    <div className="mb-4">
                                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Tags</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {post.value.tags.map((tag, index) => (
                                                <span 
                                                    key={index}
                                                    className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                                                >
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Back to Blog Button */}
                                <Button 
                                    onClick={() => navigate(`/blog/${author.handle}`)}
                                    variant="neutral"
                                    className="w-full"
                                >
                                    ← Back to {author.displayName}'s Blog
                                </Button>
                            </CardHeader>
                        </Card>
                    </div>

                    {/* Center Card - Post Content */}
                    <div className="w-[50vw] max-w-4xl">
                        <Card className="min-h-[80vh]">
                            <CardContent className="p-8">
                                <div className="post-content">
                                    <ReactMarkdown>
                                        {post.value.text}
                                    </ReactMarkdown>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    <div className="grid-bg"></div>
     </>                               
    );
}