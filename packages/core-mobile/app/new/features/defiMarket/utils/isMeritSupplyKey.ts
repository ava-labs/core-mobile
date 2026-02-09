import type { z } from 'zod'
import type { aaveMeritAprSchema } from '../schema'

type MeritSupplyResponse = z.infer<typeof aaveMeritAprSchema>
export type MeritSupplyKey =
  keyof MeritSupplyResponse['currentAPR']['actionsAPR']

export const isMeritSupplyKey = (key: string): key is MeritSupplyKey => {
  return [
    'avalanche-supply-ausd',
    'avalanche-supply-btcb',
    'avalanche-supply-gho',
    'avalanche-supply-savax',
    'avalanche-supply-usdc',
    'avalanche-supply-usdt'
  ].includes(key)
}
