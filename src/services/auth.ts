
import { supabase } from '../lib/supabaseClient.ts';
import { Session, AuthChangeEvent, AuthError, Provider } from '@supabase/supabase-js';

// --- AUTH FUNCTIONS ---

export const onAuthStateChange = (callback: (event: AuthChangeEvent, session: Session | null) => void) => {
    return supabase.auth.onAuthStateChange(callback);
}

export const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
    });
    if (error) throw new Error("Não foi possível entrar com o Google.");
};

export const signInWithFacebook = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: { redirectTo: window.location.origin }
    });
    if (error) throw new Error("Não foi possível entrar com o Facebook.");
};

export const signUpWithEmail = async (credentials: {email: string, password: string})=> {
    const { data, error } = await supabase.auth.signUp(credentials);
    if(error) throw new Error(error.message);
    if(data.user && data.user.identities?.length === 0){
        throw new Error("Um usuário com este e-mail já existe.");
    }
    return {message: "Verifique seu e-mail para confirmar a conta!"};
}

export const signInWithEmail = async (credentials: {email: string, password: string})=> {
    const { error } = await supabase.auth.signInWithPassword(credentials);
    if(error) throw new Error("Credenciais inválidas. Verifique seu e-mail e senha.");
}

export const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error("Não foi possível sair.");
}

export const deleteCurrentUserAccount = async () => {
    const { error } = await supabase.rpc('delete_user_account');
    if (error) {
        console.error("Error deleting account via RPC:", error);
        throw new Error("Não foi possível deletar a conta. Tente novamente mais tarde.");
    }
}
