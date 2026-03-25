import { Router, type Response } from 'express'
import type { AuthedRequest } from '../middleware/requireUser.js'
import { getSupabaseAdmin } from '../lib/supabase.js'
import { upsertPredictionSchema, uuidSchema } from '../../shared/validation.js'

const router = Router()

router.get('/:id/my-prediction', async (req: AuthedRequest, res: Response) => {
  const parsedId = uuidSchema.safeParse(req.params.id)
  if (!parsedId.success) {
    res.status(400).json({ success: false, error: 'Invalid event id' })
    return
  }

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('predictions')
    .select('*')
    .eq('event_id', req.params.id)
    .eq('user_id', req.user.id)
    .maybeSingle()

  if (error) {
    res.status(500).json({ success: false, error: 'Failed to load prediction' })
    return
  }

  res.status(200).json({ success: true, prediction: data })
})

router.post('/:id/prediction', async (req: AuthedRequest, res: Response) => {
  const parsedId = uuidSchema.safeParse(req.params.id)
  if (!parsedId.success) {
    res.status(400).json({ success: false, error: 'Invalid event id' })
    return
  }

  const parsedBody = upsertPredictionSchema.safeParse(req.body)
  if (!parsedBody.success) {
    res.status(400).json({ success: false, error: 'Invalid payload' })
    return
  }

  const [p1, p2, p3, p4, p5] = parsedBody.data.positions

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('predictions')
    .upsert(
      {
        user_id: req.user.id,
        event_id: req.params.id,
        position_1_driver_id: p1,
        position_2_driver_id: p2,
        position_3_driver_id: p3,
        position_4_driver_id: p4,
        position_5_driver_id: p5,
        submitted_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,event_id' },
    )
    .select('*')
    .single()

  if (error) {
    res.status(400).json({ success: false, error: error.message })
    return
  }

  res.status(200).json({ success: true, prediction: data })
})

export default router
