import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const isPlaceholder = supabaseUrl === 'your_supabase_project_url' || !supabaseUrl.startsWith('http');

if (isPlaceholder || !supabaseAnonKey) {
    console.warn('Supabase URL or Anon Key is missing or invalid. Database features will not work.');
}

export const supabase = (!isPlaceholder && supabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null as any;

