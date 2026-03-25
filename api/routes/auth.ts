/**
 * This is a user authentication API route demo.
 * Handle user registration, login, token management, etc.
 */
import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { getSupabaseAdmin, getSupabaseAnon } from '../lib/supabase.js'

const router = Router()

/**
 * User Login
 * POST /api/auth/register
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    nickname: z.string().min(1).optional(),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'Invalid payload' })
    return
  }

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: parsed.data.nickname ? { nickname: parsed.data.nickname } : undefined,
  })

  if (error || !data.user) {
    res.status(400).json({ success: false, error: error?.message || 'Failed to create user' })
    return
  }

  res.status(200).json({
    success: true,
    user: {
      id: data.user.id,
      email: data.user.email,
    },
  })
})

/**
 * User Login
 * POST /api/auth/login
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'Invalid payload' })
    return
  }

  const supabase = getSupabaseAnon()
  if (!supabase) {
    res.status(500).json({ success: false, error: 'SUPABASE_ANON_KEY not configured' })
    return
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error || !data.session) {
    res.status(401).json({ success: false, error: error?.message || 'Login failed' })
    return
  }

  res.status(200).json({
    success: true,
    session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
      token_type: data.session.token_type,
      user: {
        id: data.session.user.id,
        email: data.session.user.email,
      },
    },
  })
})

/**
 * User Logout
 * POST /api/auth/logout
 */
router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  res.status(200).json({ success: true })
})

export default router
