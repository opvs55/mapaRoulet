
import { Database } from '../types/supabase.ts';
import { supabase } from '../lib/supabaseClient.ts';
import { Comment, UserProfile } from '../types/index.ts';

// --- INTERACTIONS (LIKES, COMMENTS) ---

export const likePost = async (postId: string, userId: string) => {
    const newLike: Database['public']['Tables']['post_likes']['Insert'] = { post_id: postId, user_id: userId };
    const { error } = await supabase.from('post_likes').insert(newLike);
    if (error) throw new Error("Não foi possível curtir o post.");
};

export const unlikePost = async (postId: string, userId: string) => {
    const { error } = await supabase.from('post_likes').delete().match({ post_id: postId, user_id: userId });
    if (error) throw new Error("Não foi possível descurtir o post.");
};

export const addComment = async (postId: string, text: string, user: UserProfile): Promise<Comment> => {
    const newComment: Database['public']['Tables']['comments']['Insert'] = { post_id: postId, user_id: user.id, text };
    const { data, error } = await supabase
        .from('comments')
        .insert(newComment)
        .select()
        .single();
    
    if (error) throw new Error("Não foi possível adicionar o comentário.");

    if (!data) {
        throw new Error("Não foi possível adicionar o comentário: nenhum dado retornado.");
    }
    
    const typedData = data as any;

    return {
        id: typedData.id,
        author: user,
        text: typedData.text,
        timestamp: new Date(typedData.created_at),
        post_id: typedData.post_id,
        user_id: typedData.user_id,
    };
};

export const deleteComment = async (commentId: string) => {
    const { error } = await supabase.from('comments').delete().eq('id', commentId);
    if (error) throw new Error("Não foi possível deletar o comentário.");
};
