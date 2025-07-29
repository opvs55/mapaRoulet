

import { useState, useCallback } from 'react';
import { Post, Coordinates, UserProfile, Comment } from '../types/index.ts';
import { getPostsNearLocation, deletePost as deletePostService } from '../services/posts.ts';
import { likePost as likePostService, unlikePost as unlikePostService, addComment as addCommentService, deleteComment as deleteCommentService } from '../services/interactions.ts';
import { supabase } from '../lib/supabaseClient.ts';

export const usePosts = () => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);

    const fetchAndSetPosts = useCallback(async (coords: Coordinates, isInitialLoad: boolean) => {
        if (!isInitialLoad) setIsRefreshing(true);
        setFetchError(null);
        try {
            const fetchedPosts = await getPostsNearLocation(coords, 20); // 20km radius
            setPosts(fetchedPosts);
        } catch (error) {
            console.error(error);
            setFetchError((error as Error).message);
        } finally {
            setIsRefreshing(false);
        }
    }, []);

    const handlePostCreated = (newPost: Post) => {
        setPosts(prevPosts => [newPost, ...prevPosts].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    };

    const handleDeletePost = useCallback(async (postId: string) => {
        let originalPostsState: Post[] = [];

        // Atualização otimista da UI
        setPosts(currentPosts => {
            originalPostsState = currentPosts; // Captura o estado para reverter em caso de erro
            return currentPosts.filter(p => p.id !== postId);
        });
        
        // Limpa o post selecionado se for o que está sendo deletado
        setSelectedPost(currentSelected => {
            if (currentSelected?.id === postId) {
                return null;
            }
            return currentSelected;
        });

        try {
            await deletePostService(postId);
        } catch (error) {
            console.error("Failed to delete post:", error);
            alert((error as Error).message);
            setPosts(originalPostsState); // Reverte a UI em caso de erro
        }
    }, [setSelectedPost]); // Apenas o setter é necessário como dependência, pois é estável
    
    const handleLikePost = useCallback(async (postId: string) => {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        if (!userId) return;

        let originalPostState: Post | undefined;
        let isLiked: boolean | undefined;

        // Atualização otimista usando atualizações funcionais para evitar dependência de `posts`
        setPosts(currentPosts => {
            originalPostState = currentPosts.find(p => p.id === postId);
            if (!originalPostState) return currentPosts;
            
            isLiked = originalPostState.isLiked;
            const newLikedState = !isLiked;

            return currentPosts.map(p =>
                p.id === postId ? { ...p, isLiked: newLikedState, likes: newLikedState ? [...p.likes, userId] : p.likes.filter(id => id !== userId) } : p
            );
        });

        setSelectedPost(currentSelectedPost => {
            if (currentSelectedPost?.id !== postId) return currentSelectedPost;
            const newLikedState = !currentSelectedPost.isLiked;
            return { ...currentSelectedPost, isLiked: newLikedState, likes: newLikedState ? [...currentSelectedPost.likes, userId] : currentSelectedPost.likes.filter(id => id !== userId) };
        });

        try {
            if (isLiked === undefined) return; // Não deve acontecer
            const newLikedState = !isLiked;
            if (newLikedState) {
                await likePostService(postId, userId);
            } else {
                await unlikePostService(postId, userId);
            }
        } catch (error) {
            console.error("Failed to update like:", error);
            // Reverte em caso de erro
            setPosts(currentPosts => currentPosts.map(p => p.id === postId ? originalPostState! : p));
            setSelectedPost(currentSelectedPost => currentSelectedPost?.id === postId ? originalPostState! : currentSelectedPost);
        }
    }, []);

    const handleAddComment = useCallback(async (postId: string, commentText: string) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
            alert("Você precisa estar logado para comentar.");
            return;
        }

        const userProfile: UserProfile = {
            id: session.user.id,
            username: session.user.user_metadata.username || 'Anônimo',
            avatar_url: session.user.user_metadata.avatar_url || '',
        };

        try {
            const newComment = await addCommentService(postId, commentText, userProfile);

            const updateState = (prev: Post | null): Post | null => prev ? {
                ...prev,
                comments: [...prev.comments, newComment],
                comments_count: prev.comments_count + 1
            } : null;

            setSelectedPost(updateState);
            setPosts(prevPosts => prevPosts.map(p => p.id === postId ? updateState(p) as Post : p));

        } catch (error) {
            console.error("Failed to add comment:", error);
            alert((error as Error).message);
        }
    }, []);

    const handleDeleteComment = useCallback(async (commentId: string, postId: string) => {
        let originalSelectedPost: Post | null = null;
        let originalPosts: Post[] = [];

        const updateState = (p: Post) => ({
            ...p,
            comments: p.comments.filter(c => c.id !== commentId),
            comments_count: p.comments_count - 1
        });

        // Atualização otimista
        setSelectedPost(currentSelectedPost => {
            originalSelectedPost = currentSelectedPost;
            return currentSelectedPost?.id === postId ? updateState(currentSelectedPost) : currentSelectedPost;
        });
        setPosts(currentPosts => {
            originalPosts = currentPosts;
            return currentPosts.map(p => p.id === postId ? updateState(p) : p)
        });

        try {
            await deleteCommentService(commentId);
        } catch (error) {
            console.error("Failed to delete comment:", error);
            setPosts(originalPosts); // Reverte
            setSelectedPost(originalSelectedPost);
        }
    }, []);

    return {
        posts,
        setPosts,
        selectedPost,
        setSelectedPost,
        isRefreshing,
        fetchError,
        setFetchError,
        fetchAndSetPosts,
        handlePostCreated,
        handleDeletePost,
        handleLikePost,
        handleAddComment,
        handleDeleteComment,
    };
};
