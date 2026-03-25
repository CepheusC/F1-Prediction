export type Top5 = readonly [string, string, string, string, string]

export type PositionBreakdown = {
  predicted_position: 1 | 2 | 3 | 4 | 5
  predicted_driver_id: string
  actual_position: 1 | 2 | 3 | 4 | 5 | null
  distance: number
  base: number
  points: number
  exact: boolean
}

export type ScoreBreakdown = {
  per_position: PositionBreakdown[]
  order_bonus: number
  total: number
}

export type ScoringConfig = {
  basePoints: [number, number, number, number, number]
  distancePenalty: number
  orderBonusPerPair: number
  missingDriverDistance: number
}

export const defaultScoringConfig: ScoringConfig = {
  basePoints: [25, 18, 15, 12, 10],
  distancePenalty: 4,
  orderBonusPerPair: 2,
  missingDriverDistance: 5,
}

export function scoreTop5(prediction: Top5, result: Top5, config: ScoringConfig = defaultScoringConfig) {
  const actualPosByDriver = new Map<string, number>()
  for (let i = 0; i < result.length; i++) actualPosByDriver.set(result[i], i)

  const per_position: PositionBreakdown[] = []
  let sum = 0

  for (let i = 0 as 0 | 1 | 2 | 3 | 4; i < 5; i = (i + 1) as 0 | 1 | 2 | 3 | 4) {
    const predicted_driver_id = prediction[i]
    const actualIdx = actualPosByDriver.get(predicted_driver_id)
    const actual_position = (actualIdx === undefined ? null : ((actualIdx + 1) as 1 | 2 | 3 | 4 | 5))
    const distance = actualIdx === undefined ? config.missingDriverDistance : Math.abs(actualIdx - i)
    const base = config.basePoints[i]
    const points = Math.max(0, base - config.distancePenalty * distance)
    sum += points
    per_position.push({
      predicted_position: (i + 1) as 1 | 2 | 3 | 4 | 5,
      predicted_driver_id,
      actual_position,
      distance,
      base,
      points,
      exact: actualIdx !== undefined && actualIdx === i,
    })
  }

  let orderedPairs = 0
  for (let i = 0; i < 5; i++) {
    for (let j = i + 1; j < 5; j++) {
      const a = prediction[i]
      const b = prediction[j]
      const pa = actualPosByDriver.get(a)
      const pb = actualPosByDriver.get(b)
      if (pa === undefined || pb === undefined) continue
      if (pa < pb) orderedPairs += 1
    }
  }

  const order_bonus = orderedPairs * config.orderBonusPerPair
  const total = sum + order_bonus

  const breakdown: ScoreBreakdown = {
    per_position,
    order_bonus,
    total,
  }

  return {
    score: total,
    breakdown,
  }
}
