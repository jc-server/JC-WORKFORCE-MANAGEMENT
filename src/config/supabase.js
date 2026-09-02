import { runtimeConfig } from './runtime-config.js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || runtimeConfig.supabaseUrl;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || runtimeConfig.supabaseAnonKey;