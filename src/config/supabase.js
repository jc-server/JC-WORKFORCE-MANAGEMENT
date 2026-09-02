// Supabase client configuration
const SUPABASE_URL = window.__SUPABASE_URL__ || 'https://yqjuolwntlrnslaxyjsk.supabase.co';
const SUPABASE_ANON_KEY = window.__SUPABASE_ANON_KEY__ || 'your_anon_key_here';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_ANON_KEY === 'your_anon_key_here') {
    console.error('❌ Missing Supabase configuration. Check index.html or .env file.');
}

// Create Supabase client
export const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
