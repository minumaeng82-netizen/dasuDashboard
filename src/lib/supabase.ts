import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase URL or Anon Key is missing. Database features will not work.');
}

// Only attempt to create the client if we have a URL, otherwise provide a dummy or handle null
export const supabase = supabaseUrl
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null as any; // Using 'any' briefly to avoid breaking imports, or we could handle null in components
