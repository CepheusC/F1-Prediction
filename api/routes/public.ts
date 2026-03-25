import { Router, type Request, type Response } from 'express'
import { getSupabaseAdmin } from '../lib/supabase.js'
import { uuidSchema } from '../../shared/validation.js'

const router = Router()

router.get('/drivers', async (req: Request, res: Response) => {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('drivers')
    .select('id,name,team,is_active')
    .eq('is_active', true)
    .order('name')

  if (error) {
    res.status(500).json({ success: false, error: 'Failed to load drivers' })
    return
  }

  res.status(200).json({ success: true, drivers: data })
})

router.get('/seasons/current', async (req: Request, res: Response) => {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('seasons')
    .select('*')
    .order('year', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    res.status(500).json({ success: false, error: 'Failed to load season' })
    return
  }

  res.status(200).json({ success: true, season: data })
})

router.get('/events', async (req: Request, res: Response) => {
  const supabase = getSupabaseAdmin()
  const seasonId = typeof req.query.seasonId === 'string' ? req.query.seasonId : null

  let resolvedSeasonId = seasonId
  if (!resolvedSeasonId) {
    const { data: season, error: seasonError } = await supabase
      .from('seasons')
      .select('id')
      .order('year', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (seasonError) {
      res.status(500).json({ success: false, error: 'Failed to resolve season' })
      return
    }
    resolvedSeasonId = season?.id ?? null
  }

  if (!resolvedSeasonId) {
    res.status(200).json({ success: true, events: [] })
    return
  }

  const { data, error } = await supabase
    .from('race_events')
    .select('*')
    .eq('season_id', resolvedSeasonId)
    .order('event_date')
    .order('round')

  if (error) {
    res.status(500).json({ success: false, error: 'Failed to load events' })
    return
  }

  res.status(200).json({ success: true, events: data })
})

router.get('/leaderboard', async (req: Request, res: Response) => {
  const seasonId = typeof req.query.seasonId === 'string' ? req.query.seasonId : null
  const parsed = uuidSchema.safeParse(seasonId)
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'seasonId required' })
    return
  }

  const supabase = getSupabaseAdmin()
  const { data: totals, error } = await supabase
    .from('user_season_scores')
    .select('user_id,total_score')
    .eq('season_id', seasonId)
    .order('total_score', { ascending: false })

  if (error) {
    res.status(500).json({ success: false, error: 'Failed to load leaderboard' })
    return
  }

  const userIds = totals.map((t) => t.user_id)
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('user_id,nickname')
    .in('user_id', userIds)

  if (profileError) {
    res.status(500).json({ success: false, error: 'Failed to load profiles' })
    return
  }

  const nickByUserId = new Map(profiles.map((p) => [p.user_id, p.nickname]))
  const leaderboard = totals.map((t) => ({
    user_id: t.user_id,
    nickname: nickByUserId.get(t.user_id) ?? 'unknown',
    total_score: t.total_score,
  }))

  res.status(200).json({ success: true, leaderboard })
})

router.get('/series', async (req: Request, res: Response) => {
  const seasonId = typeof req.query.seasonId === 'string' ? req.query.seasonId : null
  const parsed = uuidSchema.safeParse(seasonId)
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'seasonId required' })
    return
  }

  const supabase = getSupabaseAdmin()
  const { data: events, error: eventError } = await supabase
    .from('race_events')
    .select('id,round,grand_prix_name,session_type,event_date')
    .eq('season_id', seasonId)
    .order('event_date')
    .order('round')

  if (eventError) {
    res.status(500).json({ success: false, error: 'Failed to load events' })
    return
  }

  const eventIds = events.map((e) => e.id)
  if (eventIds.length === 0) {
    res.status(200).json({ success: true, events: [], series: [] })
    return
  }

  const { data: scores, error: scoreError } = await supabase
    .from('scores')
    .select('user_id,event_id,score')
    .in('event_id', eventIds)

  if (scoreError) {
    res.status(500).json({ success: false, error: 'Failed to load scores' })
    return
  }

  const userIds = Array.from(new Set(scores.map((s) => s.user_id)))
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('user_id,nickname')
    .in('user_id', userIds)

  if (profileError) {
    res.status(500).json({ success: false, error: 'Failed to load profiles' })
    return
  }

  const nickByUserId = new Map(profiles.map((p) => [p.user_id, p.nickname]))
  const scoreByUserEvent = new Map(scores.map((s) => [`${s.user_id}:${s.event_id}`, s.score] as const))

  const series = userIds.map((userId) => {
    let acc = 0
    const points = events.map((e) => {
      acc += scoreByUserEvent.get(`${userId}:${e.id}`) ?? 0
      return acc
    })
    return {
      user_id: userId,
      nickname: nickByUserId.get(userId) ?? 'unknown',
      points,
    }
  })

  const eventLabels = events.map((e) => ({
    id: e.id,
    round: e.round,
    label: `${e.round} - ${e.session_type}`,
    grand_prix_name: e.grand_prix_name,
    event_date: e.event_date,
  }))

  res.status(200).json({ success: true, events: eventLabels, series })
})

export default router
