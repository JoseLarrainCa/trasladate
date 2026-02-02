import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!rawUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Sin barra final: algunas rutas de Auth devuelven 400 si la URL base termina en /
const supabaseUrl = rawUrl.replace(/\/+$/, '');

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
