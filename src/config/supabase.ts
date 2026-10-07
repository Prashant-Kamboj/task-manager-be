import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

// This client must only be imported by server-side code. Its key bypasses RLS.
const authOptions = { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } };

// Used for password sign-in, sign-up, and refresh-token exchange.
// This key is safe to use in a frontend, but this instance still runs only on the server.
export const supabaseAuth = createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, authOptions);

// This client must only be imported by server-side code. Its secret key bypasses RLS.
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
  ...authOptions,
});
