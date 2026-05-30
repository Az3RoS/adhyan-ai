/**
 * Supabase client — singleton, used everywhere.
 * Anon key is client-safe; all writes are RLS-gated by auth.uid().
 * Service-role key lives ONLY in Edge Function secrets, never here.
 */

import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnon) {
  console.warn(
    '[supabase] Missing env vars. Copy .env.example → .env and fill in values.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnon, {
  auth: {
    autoRefreshToken: true,
    persistSession:   true,
    detectSessionInUrl: false,   // Not a web app — no OAuth redirect URLs
  },
});
