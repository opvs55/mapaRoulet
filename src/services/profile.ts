
import { Database } from '../types/supabase.ts';
import { supabase } from '../lib/supabaseClient.ts';
import { UserProfile } from '../types/index.ts';


// Helper function to extract path from a Supabase storage URL.
// e.g., "https/.../avatars/user123/avatar.png" -> "user123/avatar.png"
const getPathFromUrl = (url: string, bucketName: string): string | null => {
    try {
        const urlObject = new URL(url);
        // The path will be /storage/v1/object/public/avatars/path/to/file.png
        // We want to extract "path/to/file.png"
        const pathParts = urlObject.pathname.split(`/${bucketName}/`);
        if (pathParts.length > 1) {
            // Remove any query parameters that might have been left in the path
            const path = pathParts[1].split('?')[0];
            return decodeURIComponent(path);
        }
        return null;
    } catch (e) {
        console.error("URL inválida, não foi possível extrair o caminho:", url);
        return null;
    }
};

// Helper function for handling common storage errors
const handleStorageError = (error: any) => {
    console.error('Erro no armazenamento do Supabase:', error);
    if (error.message.toLowerCase().includes('bucket not found')) {
        throw new Error('Erro de Configuração: O bucket de armazenamento "avatars" não foi encontrado no Supabase.');
    }
    if (error.message.includes('row-level security') || error.message.includes('policy')) {
        throw new Error('Permissão Negada: As políticas de segurança (RLS) para o bucket "avatars" não estão configuradas corretamente.');
    }
    throw new Error('Falha na operação de armazenamento do avatar.');
};


export const updateUserProfile = async (userId: string, username: string, avatarFile: File | null): Promise<UserProfile> => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
        throw new Error("Usuário não autenticado.");
    }

    let avatar_url: string | undefined = currentUser.user_metadata.avatar_url;
    
    // 1. If a new avatar file is provided, upload it and prepare the new URL.
    if (avatarFile) {
        const oldAvatarPath = avatar_url ? getPathFromUrl(avatar_url, 'avatars') : null;

        const fileExt = avatarFile.name.split('.').pop();
        const newFileName = `${Date.now()}.${fileExt}`;
        const newFilePath = `${userId}/${newFileName}`; // Path inside bucket: userId/filename.ext
        
        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(newFilePath, avatarFile);
        
        if (uploadError) {
            handleStorageError(uploadError);
        }

        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(newFilePath);
        if (!urlData.publicUrl) {
            throw new Error('Não foi possível obter a URL do novo avatar.');
        }
        // Update avatar_url to the new one for the next steps
        avatar_url = `${urlData.publicUrl}?t=${new Date().getTime()}`;
        
        // After new avatar is successfully uploaded and URL is retrieved, delete the old one.
        if (oldAvatarPath) {
            const { error: removeError } = await supabase.storage
                .from('avatars')
                .remove([oldAvatarPath]);
            if (removeError) {
                // Log the error but don't fail the whole operation.
                console.error("Falha ao deletar avatar antigo:", removeError);
            }
        }
    }

    // 2. Update user metadata in Supabase Auth.
    const { data: { user: updatedUser }, error: userUpdateError } = await supabase.auth.updateUser({
        data: { 
            username: username,
            avatar_url: avatar_url,
        }
    });
    
    if (userUpdateError || !updatedUser) {
        console.error('Error updating auth user metadata:', userUpdateError);
        throw new Error('Não foi possível atualizar os dados de autenticação do usuário.');
    }

    // 3. Update the public 'profiles' table for consistency.
    const profileUpdates: Database['public']['Tables']['profiles']['Update'] = {
        username: updatedUser.user_metadata.username,
        avatar_url: updatedUser.user_metadata.avatar_url,
        updated_at: new Date().toISOString(),
    };

    const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', userId);

    if (profileUpdateError) {
        console.error('Erro ao atualizar a tabela de perfis públicos:', profileUpdateError);
    }

    // 4. Return the freshly updated profile data.
    return {
        id: updatedUser.id,
        username: updatedUser.user_metadata.username as string,
        avatar_url: updatedUser.user_metadata.avatar_url as string,
    };
};
