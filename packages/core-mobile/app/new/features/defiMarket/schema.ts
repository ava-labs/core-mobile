import { z } from 'zod'

export const supplyApyHistorySchema = z.object({
  data: z.object({
    supplyAPYHistory: z.array(
      z.object({
        avgRate: z.object({
          formatted: z.string()
        })
      })
    )
  })
})

export const borrowApyHistorySchema = z.object({
  data: z.object({
    borrowAPYHistory: z.array(
      z.object({
        avgRate: z.object({
          formatted: z.string()
        })
      })
    )
  })
})

export const aaveMeritAprSchema = z.object({
  currentAPR: z.object({
    actionsAPR: z.object({
      'avalanche-supply-ausd': z.number().nullable(),
      'avalanche-supply-btcb': z.number().nullable(),
      'avalanche-supply-gho': z.number().nullable(),
      'avalanche-supply-savax': z.number().nullable(),
      'avalanche-supply-usdc': z.number().nullable(),
      'avalanche-supply-usdt': z.number().nullable()
    })
  })
})
