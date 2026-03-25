import { Router, type Response } from 'express'
import type { AuthedRequest } from '../middleware/requireUser.js'
import { getSupabaseAdmin } from '../lib/supabase.js'

const router = Router()

router.get('/', async (req: AuthedRequest, res: Response) => {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id,nickname,role,created_at')
    .eq('user_id', req.user.id)
    .maybeSingle()

  if (error) {
    res.status(500).json({ success: false, error: 'Failed to load profile' })
    return
  }

  res.status(200).json({
    success: true,
    user: {
      id: req.user.id,
      email: req.user.email,
    },
    profile: data,
  })
})

export default router
