import { createClient as createSupbaseClient } from '@supabase/supabase-js'

export function createClient() {
  return createSupbaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
