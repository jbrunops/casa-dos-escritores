// src/lib/supabase-browser.js
import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs';

export function createBrowserClient() {
  return createBrowserSupabaseClient();
}
