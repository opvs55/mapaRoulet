

import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase.ts';

// In a Vite app, environment variables are exposed via `import.meta.env`.
// Variables must be prefixed with VITE_ to be exposed to the client.
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

// Verificação para garantir que as chaves não estão vazias.
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("As chaves do Supabase (VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY) não foram encontradas. Verifique suas variáveis de ambiente.");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);