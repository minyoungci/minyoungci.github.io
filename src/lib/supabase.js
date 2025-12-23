import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://koumvvrjetfbdqmhawyo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvdW12dnJqZXRmYmRxbWhhd3lvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3NzQ3NDcsImV4cCI6MjA4MTM1MDc0N30.SFw9XA2mbc4PVQTwa-iDPGK6Z_NbKEKabe6LhaAbvSU';

// Only create client if environment variables are available (prevents build errors)
export const supabase = (supabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;
