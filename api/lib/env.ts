import { z } from 'zod'

const envSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_ANON_KEY: z.string().min(1).optional(),
  PORT: z.string().optional(),
})

export type Env = z.infer<typeof envSchema>

export function getEnv(): Env {
  const parsed = envSchema.safeParse(process.env)
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
    throw new Error(`Invalid env: ${message}`)
  }
  return parsed.data
}
