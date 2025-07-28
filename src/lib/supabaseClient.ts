


import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase.ts';

// Accessing environment variables in a type-safe way using the vite-env.d.ts definition.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Verificação para garantir que as chaves não estão vazias.
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("As chaves do Supabase (VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY) não foram encontradas. Verifique suas variáveis de ambiente.");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);