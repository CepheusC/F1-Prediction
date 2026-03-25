import { Router, type Response } from 'express'
import type { AuthedRequest } from '../middleware/requireUser.js'
import { getSupabaseAdmin } from '../lib/supabase.js'
import {
  createDriverSchema,
  updateDriverSchema,
  createSeasonSchema,
  createEventSchema,
  upsertResultSchema,
  uuidSchema,
} from '../../shared/validation.js'
import { scoreTop5 } from '../../shared/scoring.js'

const router = Router()

router.get('/drivers', async (req: AuthedRequest, res: Response) => {
  void req
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('drivers')
    .select('*')
    .order('name')

  if (error) {
    res.status(500).json({ success: false, error: 'Failed to load drivers' })
    return
  }

  res.status(200).json({ success: true, drivers: data })
})

router.get('/seasons', async (req: AuthedRequest, res: Response) => {
  void req
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('seasons')
    .select('*')
    .order('year', { ascending: false })

  if (error) {
    res.status(500).json({ success: false, error: 'Failed to load seasons' })
    return
  }

  res.status(200).json({ success: true, seasons: data })
})

router.get('/events', async (req: AuthedRequest, res: Response) => {
  void req
  const seasonId = typeof req.query.seasonId === 'string' ? req.query.seasonId : null
  const parsed = uuidSchema.safeParse(seasonId)
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'seasonId required' })
    return
  }

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('race_events')
    .select('*')
    .eq('season_id', seasonId)
    .order('event_date')
    .order('round')

  if (error) {
    res.status(500).json({ success: false, error: 'Failed to load events' })
    return
  }

  res.status(200).json({ success: true, events: data })
})

router.get('/events/:id/result', async (req: AuthedRequest, res: Response) => {
  void req
  const parsedId = uuidSchema.safeParse(req.params.id)
  if (!parsedId.success) {
    res.status(400).json({ success: false, error: 'Invalid event id' })
    return
  }

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('race_results')
    .select('*')
    .eq('event_id', req.params.id)
    .maybeSingle()

  if (error) {
    res.status(500).json({ success: false, error: 'Failed to load result' })
    return
  }

  res.status(200).json({ success: true, result: data })
})

router.post('/drivers', async (req: AuthedRequest, res: Response) => {
  const parsed = createDriverSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'Invalid payload' })
    return
  }
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('drivers')
    .insert(parsed.data)
    .select('*')
    .single()
  if (error) {
    res.status(400).json({ success: false, error: error.message })
    return
  }
  res.status(200).json({ success: true, driver: data })
})

router.patch('/drivers/:id', async (req: AuthedRequest, res: Response) => {
  const parsedId = uuidSchema.safeParse(req.params.id)
  if (!parsedId.success) {
    res.status(400).json({ success: false, error: 'Invalid driver id' })
    return
  }
  const parsed = updateDriverSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'Invalid payload' })
    return
  }
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('drivers')
    .update(parsed.data)
    .eq('id', req.params.id)
    .select('*')
    .single()
  if (error) {
    res.status(400).json({ success: false, error: error.message })
    return
  }
  res.status(200).json({ success: true, driver: data })
})

router.post('/seasons', async (req: AuthedRequest, res: Response) => {
  const parsed = createSeasonSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'Invalid payload' })
    return
  }
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('seasons')
    .insert(parsed.data)
    .select('*')
    .single()
  if (error) {
    res.status(400).json({ success: false, error: error.message })
    return
  }
  res.status(200).json({ success: true, season: data })
})

router.post('/events', async (req: AuthedRequest, res: Response) => {
  const parsed = createEventSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'Invalid payload' })
    return
  }
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('race_events')
    .insert(parsed.data)
    .select('*')
    .single()
  if (error) {
    res.status(400).json({ success: false, error: error.message })
    return
  }
  res.status(200).json({ success: true, event: data })
})

router.post('/events/:id/result', async (req: AuthedRequest, res: Response) => {
  const parsedId = uuidSchema.safeParse(req.params.id)
  if (!parsedId.success) {
    res.status(400).json({ success: false, error: 'Invalid event id' })
    return
  }
  const parsed = upsertResultSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'Invalid payload' })
    return
  }
  const [p1, p2, p3, p4, p5] = parsed.data.positions
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('race_results')
    .upsert(
      {
        event_id: req.params.id,
        position_1_driver_id: p1,
        position_2_driver_id: p2,
        position_3_driver_id: p3,
        position_4_driver_id: p4,
        position_5_driver_id: p5,
        is_finalized: false,
      },
      { onConflict: 'event_id' },
    )
    .select('*')
    .single()
  if (error) {
    res.status(400).json({ success: false, error: error.message })
    return
  }
  res.status(200).json({ success: true, result: data })
})

router.post('/events/:id/finalize', async (req: AuthedRequest, res: Response) => {
  const parsedId = uuidSchema.safeParse(req.params.id)
  if (!parsedId.success) {
    res.status(400).json({ success: false, error: 'Invalid event id' })
    return
  }

  const supabase = getSupabaseAdmin()

  const { data: event, error: eventError } = await supabase
    .from('race_events')
    .select('id,season_id')
    .eq('id', req.params.id)
    .single()
  if (eventError) {
    res.status(400).json({ success: false, error: 'Event not found' })
    return
  }

  const { data: result, error: resultError } = await supabase
    .from('race_results')
    .select('*')
    .eq('event_id', req.params.id)
    .single()
  if (resultError) {
    res.status(400).json({ success: false, error: 'Result not found' })
    return
  }

  const { error: finalizeError } = await supabase
    .from('race_results')
    .update({ is_finalized: true })
    .eq('event_id', req.params.id)
  if (finalizeError) {
    res.status(400).json({ success: false, error: finalizeError.message })
    return
  }

  const top5Result = [
    result.position_1_driver_id,
    result.position_2_driver_id,
    result.position_3_driver_id,
    result.position_4_driver_id,
    result.position_5_driver_id,
  ] as const

  const { data: predictions, error: predError } = await supabase
    .from('predictions')
    .select('*')
    .eq('event_id', req.params.id)

  if (predError) {
    res.status(500).json({ success: false, error: 'Failed to load predictions' })
    return
  }

  for (const prediction of predictions) {
    const top5Prediction = [
      prediction.position_1_driver_id,
      prediction.position_2_driver_id,
      prediction.position_3_driver_id,
      prediction.position_4_driver_id,
      prediction.position_5_driver_id,
    ] as const
    const scored = scoreTop5(top5Prediction, top5Result)
    const { error: scoreUpsertError } = await supabase
      .from('scores')
      .upsert(
        {
          user_id: prediction.user_id,
          event_id: req.params.id,
          score: scored.score,
          breakdown: scored.breakdown,
        },
        { onConflict: 'user_id,event_id' },
      )
    if (scoreUpsertError) {
      res.status(500).json({ success: false, error: 'Failed to write scores' })
      return
    }
  }

  const { data: seasonEvents, error: seasonEventsError } = await supabase
    .from('race_events')
    .select('id')
    .eq('season_id', event.season_id)
  if (seasonEventsError) {
    res.status(500).json({ success: false, error: 'Failed to load season events' })
    return
  }

  const seasonEventIds = seasonEvents.map((e) => e.id)
  const { data: seasonScores, error: seasonScoresError } = await supabase
    .from('scores')
    .select('user_id,score,event_id')
    .in('event_id', seasonEventIds)
  if (seasonScoresError) {
    res.status(500).json({ success: false, error: 'Failed to load season scores' })
    return
  }

  const totalByUser = new Map<string, number>()
  for (const s of seasonScores) {
    totalByUser.set(s.user_id, (totalByUser.get(s.user_id) ?? 0) + s.score)
  }

  for (const [userId, total] of totalByUser) {
    const { error: upsertTotalError } = await supabase
      .from('user_season_scores')
      .upsert(
        {
          user_id: userId,
          season_id: event.season_id,
          total_score: total,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,season_id' },
      )
    if (upsertTotalError) {
      res.status(500).json({ success: false, error: 'Failed to update totals' })
      return
    }
  }

  res.status(200).json({ success: true })
})

export default router
