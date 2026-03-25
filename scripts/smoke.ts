import 'dotenv/config'
import app from '../api/app.js'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

function authHeader(token: string) {
  return { authorization: `Bearer ${token}` }
}

async function main() {
  const server = app.listen(0)
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Failed to bind server')
  const baseUrl = `http://127.0.0.1:${address.port}`

  const request = async (method: string, path: string, body?: unknown, headers?: Record<string, string>) => {
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        'content-type': 'application/json',
        ...(headers ?? {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    const json = await res.json().catch(() => null)
    return { status: res.status, json }
  }

  try {
    const health = await request('GET', '/api/health')
    if (health.status !== 200) throw new Error(`Health failed: ${health.status}`)

    const email = `smoke_${Date.now()}@example.com`
    const password = 'password123'
    const nickname = 'smoke'

    const reg = await request('POST', '/api/auth/register', { email, password, nickname })
    if (reg.status !== 200) throw new Error(`Register failed: ${reg.status}`)
    const userId = reg.json?.user?.id
    if (!userId) throw new Error('Register returned no user id')

    const login = await request('POST', '/api/auth/login', { email, password })
    if (login.status !== 200) throw new Error(`Login failed: ${login.status}`)
    const token = login.json?.session?.access_token
    if (!token) throw new Error('Login returned no access token')

    const { error: promoteError } = await supabaseAdmin
      .from('profiles')
      .update({ role: 'admin' })
      .eq('user_id', userId)
    if (promoteError) throw new Error(`Promote failed: ${promoteError.message}`)

    const drivers: string[] = []
    for (let i = 1; i <= 5; i++) {
      const created = await request(
        'POST',
        '/api/admin/drivers',
        { name: `Driver ${i}`, team: `Team ${i}`, is_active: true },
        authHeader(token),
      )
      if (created.status !== 200) throw new Error(`Create driver failed: ${created.status}`)
      drivers.push(created.json?.driver?.id)
    }
    if (drivers.some((d) => typeof d !== 'string')) throw new Error('Driver ids missing')

    const year = 2026
    const seasonRes = await request('POST', '/api/admin/seasons', { year }, authHeader(token))
    if (seasonRes.status !== 200) throw new Error(`Create season failed: ${seasonRes.status}`)
    const seasonId = seasonRes.json?.season?.id
    if (!seasonId) throw new Error('Season id missing')

    const now = new Date()
    const deadline = new Date(now.getTime() + 60 * 60 * 1000)
    const eventRes = await request(
      'POST',
      '/api/admin/events',
      {
        season_id: seasonId,
        round: 1,
        grand_prix_name: 'Smoke GP',
        session_type: 'Race',
        event_date: now.toISOString().slice(0, 10),
        prediction_deadline: deadline.toISOString(),
      },
      authHeader(token),
    )
    if (eventRes.status !== 200) throw new Error(`Create event failed: ${eventRes.status}`)
    const eventId = eventRes.json?.event?.id
    if (!eventId) throw new Error('Event id missing')

    const predRes = await request(
      'POST',
      `/api/events/${eventId}/prediction`,
      { positions: [drivers[0], drivers[1], drivers[2], drivers[3], drivers[4]] },
      authHeader(token),
    )
    if (predRes.status !== 200) throw new Error(`Submit prediction failed: ${predRes.status}`)

    const resultRes = await request(
      'POST',
      `/api/admin/events/${eventId}/result`,
      { positions: [drivers[1], drivers[0], drivers[2], drivers[4], drivers[3]] },
      authHeader(token),
    )
    if (resultRes.status !== 200) throw new Error(`Upsert result failed: ${resultRes.status}`)

    const fin = await request('POST', `/api/admin/events/${eventId}/finalize`, {}, authHeader(token))
    if (fin.status !== 200) throw new Error(`Finalize failed: ${fin.status}`)

    const leaderboard = await request('GET', `/api/public/leaderboard?seasonId=${seasonId}`)
    if (leaderboard.status !== 200) throw new Error(`Leaderboard failed: ${leaderboard.status}`)
    const row = leaderboard.json?.leaderboard?.[0]
    if (!row || row.user_id !== userId) throw new Error('Leaderboard missing user')

    const series = await request('GET', `/api/public/series?seasonId=${seasonId}`)
    if (series.status !== 200) throw new Error(`Series failed: ${series.status}`)

    console.log('smoke:ok')
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()))
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
