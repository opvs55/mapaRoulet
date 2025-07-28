


import { Database } from '../types/supabase.ts';
import { supabase } from '../lib/supabaseClient.ts';
import { Post, Comment, Coordinates, UserProfile } from '../types/index.ts';
import { Session, AuthChangeEvent } from '@supabase/supabase-js';

// Função auxiliar para converter string base64 em um objeto File
const base64ToFile = (base64: string, filename: string): File => {
    const byteString = atob(base64);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: 'image/jpeg' });
    return new File([blob], filename, { type: 'image/jpeg' });
};

export const getPostsNearLocation = async (coords: Coordinates, radiusInKm: number): Promise<Post[]> => {
    const { data: { session } } = await supabase.auth.getSession();
    const currentUserId = session?.user?.id;

    // First, call the RPC function to get the IDs of nearby posts
    const { data: postIdsData, error: rpcError } = await supabase.rpc(
        'get_nearby_post_ids', {
            user_lat: coords.lat,
            user_lng: coords.lng,
            radius_km: radiusInKm,
        }
    );

    if (rpcError) {
        console.error("Error fetching nearby post IDs:", rpcError);
        // Don't throw, just return empty so the app doesn't crash.
        // The error is logged for debugging.
        return [];
    }

    if (!postIdsData || (postIdsData as any[]).length === 0) {
        return []; // No posts nearby, return empty array.
    }

    const postIds = (postIdsData as any[]).map((item: {id: string}) => item.id);

    // Now, fetch the full data for the posts that are nearby
    const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
            id,
            created_at,
            text,
            image_url,
            lat,
            lng,
            category,
            author:profiles!posts_user_id_fkey(id, username, avatar_url),
            comments(
                id,
                created_at,
                text,
                user_id,
                author:profiles!comments_user_id_fkey(id, username, avatar_url)
            ),
            post_likes(user_id)
        `)
        .in('id', postIds)
        .order('created_at', { ascending: false });

    if (postsError) {
        console.error("Error fetching posts:", postsError);
        throw new Error("Não foi possível buscar os rolês.");
    }

    if (!postsData) return [];
    
    // Map the clean, nested data structure from Supabase to our application's Post type.
    const transformedPosts: Post[] = postsData.map((post: any) => {
        const authorProfile: UserProfile = post.author || {
            id: 'unknown',
            username: 'Usuário Desconhecido',
            avatar_url: `https://api.pravatar.cc/150?u=unknown`
        };

        const comments: Comment[] = (post.comments || []).map((c: any) => ({
            id: c.id,
            text: c.text,
            timestamp: new Date(c.created_at),
            post_id: post.id,
            user_id: c.user_id,
            author: c.author || {
                id: c.user_id,
                username: 'Usuário Desconhecido',
                avatar_url: `https://api.pravatar.cc/150?u=${c.user_id}`
            },
        })).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()); // Sort comments ascending by time

        const likes: string[] = (post.post_likes || []).map((l: any) => l.user_id);

        return {
            id: post.id,
            coordinates: { lat: post.lat, lng: post.lng },
            text: post.text,
            imageUrl: post.image_url,
            timestamp: new Date(post.created_at),
            category: post.category,
            author: {
              id: authorProfile.id,
              username: authorProfile.username || 'Anônimo',
              avatar_url: authorProfile.avatar_url || `https://api.pravatar.cc/150?u=${authorProfile.id}`
            },
            comments: comments,
            comments_count: comments.length,
            likes: likes,
            isLiked: currentUserId ? likes.includes(currentUserId) : false,
        };
    });

    return transformedPosts;
};


export const createPost = async (postData: {
    userLocation: Coordinates;
    description: string;
    imageBase64: string;
    category: string;
    user: UserProfile;
}): Promise<Post> => {
    const { userLocation, description, imageBase64, category, user } = postData;

    const fileName = `${user.id}/${Date.now()}.jpg`;
    const file = base64ToFile(imageBase64, fileName);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
        .from('posts')
        .upload(fileName, file);

    if (uploadError) {
        console.error("Error uploading image:", uploadError);
        throw new Error("Falha ao fazer upload da imagem.");
    }

    const { data: publicUrlData } = supabase.storage
        .from('posts')
        .getPublicUrl(uploadData.path);
        
    const imageUrl = publicUrlData.publicUrl;

    const postToInsert: Database['public']['Tables']['posts']['Insert'] = {
        text: description,
        image_url: imageUrl,
        category: category,
        lat: userLocation.lat,
        lng: userLocation.lng,
        user_id: user.id,
    };

    const { data: postInsertData, error: insertError } = await supabase
        .from('posts')
        .insert([postToInsert] as any)
        .select()
        .single();

    if (insertError || !postInsertData) {
        console.error("Error inserting post:", insertError);
        throw new Error("Não foi possível criar o rolê.");
    }
    
    // The user profile is passed in, so we can use it directly.
    const authorProfile: UserProfile = user;
    const newPostData = postInsertData as any;

    return {
        id: newPostData.id,
        text: newPostData.text,
        imageUrl: newPostData.image_url,
        category: newPostData.category,
        coordinates: { lat: newPostData.lat, lng: newPostData.lng },
        timestamp: new Date(newPostData.created_at),
        author: authorProfile,
        comments: [],
        likes: [],
        comments_count: 0,
        isLiked: false,
    };
};

export const deletePost = async (postId: string): Promise<void> => {
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (error) {
        console.error("Error deleting post:", error);
        throw new Error("Não foi possível deletar o rolê.");
    }
};

// --- Like Functions ---

export const likePost = async (postId: string, userId: string): Promise<void> => {
    const likeToInsert: Database['public']['Tables']['post_likes']['Insert'] = { post_id: postId, user_id: userId };
    const { error } = await supabase.from('post_likes').insert([likeToInsert] as any);
    if (error) {
        console.error("Error liking post:", error);
        throw new Error("Não foi possível curtir o post.");
    }
};

export const unlikePost = async (postId: string, userId: string): Promise<void> => {
    const { error } = await supabase.from('post_likes').delete().match({ post_id: postId, user_id: userId });
     if (error) {
        console.error("Error unliking post:", error);
        throw new Error("Não foi possível descurtir o post.");
    }
};

// --- Comment Functions ---

export const addComment = async (postId: string, text: string, user: UserProfile): Promise<Comment> => {
    const commentToInsert: Database['public']['Tables']['comments']['Insert'] = { post_id: postId, text, user_id: user.id };
    const { data, error } = await supabase
        .from('comments')
        .insert([commentToInsert] as any)
        .select()
        .single();

    if (error || !data) {
        console.error("Error adding comment:", error);
        throw new Error("Não foi possível adicionar o comentário.");
    }
    
    const commentData = data as any;
    return {
        id: commentData.id,
        text: commentData.text,
        timestamp: new Date(commentData.created_at),
        post_id: commentData.post_id,
        user_id: user.id,
        author: user,
    };
};

export const deleteComment = async (commentId: string): Promise<void> => {
    const { error } = await supabase.from('comments').delete().eq('id', commentId);
    if (error) {
        console.error("Error deleting comment:", error);
        throw new Error("Não foi possível deletar o comentário.");
    }
};


// --- Auth Functions ---

const handleOAuthRedirect = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
};

export const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin,
            skipBrowserRedirect: true, 
        },
    });
    if (error) {
        console.error('Error getting Google sign-in URL:', error);
        throw new Error('Falha ao iniciar o login com o Google.');
    }
    if (data.url) {
        handleOAuthRedirect(data.url);
    }
};

export const signInWithFacebook = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
            redirectTo: window.location.origin,
            skipBrowserRedirect: true,
        },
    });
     if (error) {
        console.error('Error getting Facebook sign-in URL:', error);
        throw new Error('Falha ao iniciar o login com o Facebook.');
    }
    if (data.url) {
        handleOAuthRedirect(data.url);
    }
};

export const signInWithEmail = async ({ email, password }: {email: string, password: string}):Promise<void> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
        if (error.message.includes('Invalid login credentials')) {
            throw new Error('E-mail ou senha inválidos.');
        }
        console.error('Error signing in:', error);
        throw new Error('Falha ao entrar. Tente novamente.');
    }
};

export const signUpWithEmail = async ({ email, password }: {email: string, password: string}) => {
    const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
            emailRedirectTo: window.location.origin,
        }
    });

    if (error) {
        if (error.message.includes('User already registered')) {
            throw new Error('Este e-mail já foi cadastrado.');
        }
        console.error('Error signing up:', error);
        throw new Error('Falha ao criar a conta. Tente novamente.');
    }

    if (data.user && !data.session) {
         return { message: 'Por favor, verifique seu e-mail para confirmar sua conta.' };
    }
    
    return { message: 'Cadastro realizado! Você já pode entrar.'};
};

export const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Error signing out:', error);
        throw new Error('Falha ao sair.');
    }
};

export const deleteCurrentUserAccount