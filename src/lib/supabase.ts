import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!rawUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Sin barra final: algunas rutas de Auth devuelven 400 si la URL base termina en /
const supabaseUrl = rawUrl.replace(/\/+$/, '');

// Using untyped client to avoid type mismatches with external Supabase schema
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
