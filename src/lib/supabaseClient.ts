
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase.ts';

// As credenciais do Supabase são carregadas a partir de variáveis de ambiente
// para garantir a segurança em produção.
// Em um ambiente Vite, essas variáveis devem começar com VITE_ para serem expostas ao cliente.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("As credenciais do Supabase (VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY) não foram encontradas. Verifique suas variáveis de ambiente.");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
