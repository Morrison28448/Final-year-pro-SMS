const { createClient } = require('@supabase/supabase-js')
const env = require('./env')

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    // Service role key bypasses RLS — never expose this on the client
    autoRefreshToken: false,
    persistSession: false,
  },
})

/**
 * Ping Supabase to verify credentials and network reachability.
 * Queries auth.users with count — this table always exists in every
 * Supabase project and the service role key always has access to it.
 */
const connectSupabase = async () => {
  try {
    const { error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .limit(0)

    // "PGRST116" = table not found in public schema — that's fine,
    // it means the connection and credentials are valid, just no
    // public.users table yet (we'll create it in the next step)
    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message)
    }

    console.log('[SUPABASE] Connected successfully')
  } catch (err) {
    console.error('[SUPABASE] Connection failed:', err.message)
    process.exit(1)
  }
}

module.exports = { supabase, connectSupabase }
