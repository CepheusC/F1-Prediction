import { createClient } from '@supabase/supabase-js'
import { getEnv } from './env.js'

export function getSupabaseAdmin() {
  const env = getEnv()
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

export function getSupabaseAnon() {
  const env = getEnv()
  if (!env.SUPABASE_ANON_KEY) return null
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
