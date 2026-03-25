import type { Response, NextFunction } from 'express'
import type { AuthedRequest } from './requireUser.js'
import { getSupabaseAdmin } from '../lib/supabase.js'

export async function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', req.user.id)
    .maybeSingle()

  if (error) {
    res.status(500).json({ success: false, error: 'Failed to check role' })
    return
  }

  if (data?.role !== 'admin') {
    res.status(403).json({ success: false, error: 'Admin only' })
    return
  }

  next()
}
