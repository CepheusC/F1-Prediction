import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env')
}

const email = process.argv[2]
if (!email) {
  throw new Error('Usage: npx tsx scripts/make-admin.ts <email>')
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

async function main() {
  let foundUserId: string | null = null
  let page = 1
  const perPage = 200

  while (!foundUserId) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage })
    if (error) throw new Error(error.message)

    const user = data.users.find((u) => (u.email ?? '').toLowerCase() === email.toLowerCase())
    if (user?.id) {
      foundUserId = user.id
      break
    }

    if (data.users.length < perPage) break
    page += 1
  }

  if (!foundUserId) {
    throw new Error(`User not found for email: ${email}. Please register first.`)
  }

  const { error: upsertError } = await supabaseAdmin
    .from('profiles')
    .upsert({ user_id: foundUserId, nickname: email, role: 'admin' }, { onConflict: 'user_id' })

  if (upsertError) throw new Error(upsertError.message)

  console.log(`ok: ${email} -> admin (${foundUserId})`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
