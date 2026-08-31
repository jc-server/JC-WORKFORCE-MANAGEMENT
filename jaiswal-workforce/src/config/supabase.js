// Supabase configuration for new project
const SUPABASE_URL = 'https://yqjuolwntlrnslaxyjsk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxanVvbHdudGxybnNsYXh5anNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxODgyNzUsImV4cCI6MjEwMzc2NDI3NX0.eXH0tVe7kmUCKOwiwqOatSrlVONMZoblGG7_jwyPcqU';

// Create Supabase client
export const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export config for use elsewhere
export const config = {
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY
};