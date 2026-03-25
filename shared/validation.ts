import { z } from 'zod'

export const uuidSchema = z.string().uuid()

export const top5Schema = z
  .tuple([uuidSchema, uuidSchema, uuidSchema, uuidSchema, uuidSchema])
  .refine((ids) => new Set(ids).size === 5, { message: 'Duplicate driver' })

export const createDriverSchema = z.object({
  name: z.string().min(1),
  team: z.string().min(1).optional(),
  is_active: z.boolean().optional(),
})

export const updateDriverSchema = z.object({
  name: z.string().min(1).optional(),
  team: z.string().min(1).nullable().optional(),
  is_active: z.boolean().optional(),
})

export const createSeasonSchema = z.object({
  year: z.number().int().min(1950).max(2100),
})

export const sessionTypeSchema = z.enum(['Quali', 'Race', 'Sprint', 'Sprint Quali'])

export const createEventSchema = z.object({
  season_id: uuidSchema,
  round: z.number().int().min(1),
  grand_prix_name: z.string().min(1),
  session_type: sessionTypeSchema,
  event_date: z.string().min(1),
  prediction_deadline: z.string().min(1),
})

export const upsertResultSchema = z.object({
  positions: top5Schema,
})

export const upsertPredictionSchema = z.object({
  positions: top5Schema,
})
