import { createClient as createSupbaseClient } from '@supabase/supabase-js'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    console.warn('Supabase keys are missing in the environment');
    return null as any; 
  }
  
  return createSupbaseClient(url, key)
}
