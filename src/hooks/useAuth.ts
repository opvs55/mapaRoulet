
import { useState, useEffect, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { UserProfile } from '../types/index.ts';
import { onAuthStateChange, signOut as signOutService, deleteCurrentUserAccount as deleteAccountService } from '../services/auth.ts';
import { supabase } from '../lib/supabaseClient.ts';

export const useAuth = () => {
    const [session, setSession] = useState<Session | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Fetch session on initial load
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            const profile = session?.user?.user_metadata as UserProfile | null;
            setUserProfile(profile);
            setIsLoading(false);
        });

        const { data: authListener } = onAuthStateChange((_event, session) => {
            setSession(session);
            
            if (session) {
                const profile = session.user.user_metadata as UserProfile | null;
                setUserProfile(profile);
            } else {
                setUserProfile(null);
            }

            // In case the initial getSession is slow, this will stop the loading
            setIsLoading(false);
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    const signOut = useCallback(async () => {
        await signOutService();
        setUserProfile(null);
        setSession(null);
    }, []);
    
    const deleteAccount = useCallback(async () => {
        await deleteAccountService();
        setUserProfile(null);
        setSession(null);
    }, []);

    return { session, userProfile, setUserProfile, isLoading, signOut, deleteAccount };
};