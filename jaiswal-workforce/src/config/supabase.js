// Supabase configuration with hardcoded credentials
const SUPABASE_URL = 'https://eylysvckokpebbnxlylf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5bHlzdmNrb2twZWJibnhseWxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwOTc4MDMsImV4cCI6MjEwMzY3MzgwM30.OiWywLxYZJnlgwlEfaPKd8qGH2a8df2-T8Zfyo06QcJ';

// Create Supabase client
export const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export config for use elsewhere
export const config = {
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY
};