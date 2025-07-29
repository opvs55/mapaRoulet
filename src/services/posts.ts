
import { Database } from '../types/supabase.ts';
import { supabase } from '../lib/supabaseClient.ts';
import { Post, Comment, Coordinates, UserProfile } from '../types/index.ts';

// --- POSTS FUNCTIONS ---

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
    
    const { data: nearbyPostIds, error: rpcError } = await supabase.rpc('get_nearby_post_ids', {
        user_lat: coords.lat,
        user_lng: coords.lng,
        radius_km: radiusInKm,
    });

    if (rpcError) {
        console.error("Error calling get_nearby_post_ids RPC:", rpcError);
        if (rpcError.message.includes("does not exist")) {
             throw new Error("Função 'get_nearby_post_ids' não encontrada no banco de dados.");
        }
        if (rpcError.message.includes("fetch")) {
            throw new Error("Falha de rede ao buscar rolês. Verifique sua conexão e as configurações de CORS do Supabase.");
        }
        throw new Error("Não foi possível buscar os rolês por localização.");
    }

    const typedNearbyPostIds = nearbyPostIds as unknown as { id: string }[];

    if (!typedNearbyPostIds || typedNearbyPostIds.length === 0) {
        return [];
    }
    const postIds = typedNearbyPostIds.map((p) => p.id);

    const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
            id, created_at, text, image_url, lat, lng, category,
            author: profiles!posts_user_id_fkey(id, username, avatar_url),
            comments(id, created_at, text, user_id, author: profiles!comments_user_id_fkey(id, username, avatar_url)),
            likes: post_likes(user_id)
        `)
        .in('id', postIds)
        .order('created_at', { ascending: false });


    if (postsError) {
        console.error("Error fetching posts:", postsError);
        throw new Error("Não foi possível buscar os detalhes dos rolês.");
    }

    if (!postsData) return [];
    
    // Using `as any` because TS can't infer the aliased relationships from the select string.
    const anyPostsData = postsData as any[];
    
    return anyPostsData.map((post): Post => {
        const author: UserProfile = post.author
            ? { id: post.author.id, username: post.author.username || 'Anônimo', avatar_url: post.author.avatar_url || '' }
            : { id: 'unknown', username: 'Anônimo', avatar_url: '' };

        const comments: Comment[] = (post.comments || []).map((c: any) => {
             const commentAuthor: UserProfile = c.author
                ? { id: c.author.id, username: c.author.username || 'Anônimo', avatar_url: c.author.avatar_url || '' }
                : { id: 'unknown', username: 'Anônimo', avatar_url: '' };
            return {
                id: c.id,
                author: commentAuthor,
                text: c.text,
                timestamp: new Date(c.created_at),
                post_id: post.id,
                user_id: c.user_id,
            };
        }).sort((a,b) => a.timestamp.getTime() - b.timestamp.getTime());
        
        const likes = (post.likes || []).map((like: any) => like.user_id);
        
        return {
            id: post.id,
            coordinates: { lat: post.lat, lng: post.lng },
            text: post.text,
            imageUrl: post.image_url,
            timestamp: new Date(post.created_at),
            likes,
            isLiked: currentUserId ? likes.includes(currentUserId) : false,
            comments,
            comments_count: comments.length,
            category: post.category,
            author,
        };
    });
};

export const createPost = async (params: { userLocation: Coordinates; description: string; imageBase64: string; category: string; user: UserProfile }): Promise<Post> => {
    const { userLocation, description, imageBase64, category, user } = params;
    
    const fileName = `${Date.now()}.jpg`;
    // Salva a imagem em uma pasta com o ID do usuário para maior segurança e organização
    const imagePath = `${user.id}/${fileName}`;
    const imageFile = base64ToFile(imageBase64, fileName);

    const { error: uploadError } = await supabase.storage
      .from('posts')
      .upload(imagePath, imageFile);

    if (uploadError) {
        console.error("Error uploading post image:", uploadError);
        if (uploadError.message.toLowerCase().includes('bucket not found')) {
            throw new Error('Erro de Configuração: O bucket de armazenamento "posts" não foi encontrado no Supabase. Crie-o no painel do seu projeto.');
        }
        throw new Error("Falha no upload da imagem: " + uploadError.message);
    }

    const { data: urlData } = supabase.storage.from('posts').getPublicUrl(imagePath);
    if (!urlData.publicUrl) throw new Error("Não foi possível obter a URL da imagem.");

    const newPost: Database['public']['Tables']['posts']['Insert'] = {
        user_id: user.id,
        lat: userLocation.lat,
        lng: userLocation.lng,
        text: description,
        image_url: urlData.publicUrl,
        category: category,
    };

    const { data: newPostData, error: insertError } = await supabase
        .from('posts')
        .insert(newPost)
        .select()
        .single();
    
    if (insertError) throw new Error("Falha ao criar o post: " + insertError.message);

    if (!newPostData) {
        throw new Error("Falha ao criar o post: dados não retornados.");
    }
    
    const typedNewPostData = newPostData as any;

    return {
        id: typedNewPostData.id,
        coordinates: { lat: typedNewPostData.lat, lng: typedNewPostData.lng },
        text: typedNewPostData.text,
        imageUrl: typedNewPostData.image_url,
        timestamp: new Date(typedNewPostData.created_at),
        likes: [],
        isLiked: false,
        comments: [],
        comments_count: 0,
        category: typedNewPostData.category,
        author: user,
    };
};

export const deletePost = async (postId: string) => {
    // 1. Obter a URL da imagem do post que será deletado
    const { data: postData, error: fetchError } = await supabase
        .from('posts')
        .select('image_url')
        .eq('id', postId)
        .single();

    if (fetchError || !postData) {
        console.error('Post not found, cannot delete image.', fetchError);
        // Prosseguir para deletar o registro do DB mesmo assim, pode ser um post sem imagem
    } else {
        // 2. Extrair o caminho do arquivo da URL para usar na exclusão do storage
        const imageUrl = (postData as any).image_url;
        try {
            const url = new URL(imageUrl);
            const pathParts = url.pathname.split('/posts/');
            if (pathParts.length > 1) {
                const filePath = decodeURIComponent(pathParts[1]);
                
                // 3. Deletar a imagem do storage
                const { error: storageError } = await supabase.storage
                    .from('posts')
                    .remove([filePath]);
                
                if (storageError) {
                    // Logar o erro mas não impedir a exclusão do post do DB
                    console.error("Failed to delete post image from storage, but proceeding with DB record deletion:", storageError);
                }
            }
        } catch (e) {
            console.error("Invalid image URL, cannot delete from storage:", imageUrl);
        }
    }

    // 4. Deletar o post do banco de dados (o RLS/cascade vai deletar likes e comentários)
    const { error: dbError } = await supabase.from('posts').delete().eq('id', postId);
    if (dbError) {
        console.error("Error deleting post from database:", dbError);
        throw new Error("Não foi possível deletar o post.");
    }
};
