import type { Request, Response, NextFunction } from 'express'
import { getSupabaseAdmin } from '../lib/supabase.js'

export type AuthedRequest = Request & {
  user: {
    id: string
    email: string | null
  }
}

export async function requireUser(req: Request, res: Response, next: NextFunction) {
  const header = req.header('authorization') || ''
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : null
  if (!token) {
    res.status(401).json({ success: false, error: 'Missing bearer token' })
    return
  }

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) {
    res.status(401).json({ success: false, error: 'Invalid token' })
    return
  }

  ;(req as AuthedRequest).user = {
    id: data.user.id,
    email: data.user.email ?? null,
  }

  next()
}
