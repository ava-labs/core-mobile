import { MeritAprs } from '../hooks/aave/useMeritAprs'
import { isMeritSupplyKey, MeritSupplyKey } from './isMeritSupplyKey'

/**
 * Calculates Merit APR bonus for a given asset symbol
 */
export const getMeritAprBonus = (
  symbol: string,
  meritAprs: MeritAprs | undefined
): number => {
  const formattedSymbol = symbol.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
  const maybeMeritSupplyKey = `avalanche-supply-${formattedSymbol}`
  const maybeMeritApr = isMeritSupplyKey(maybeMeritSupplyKey)
    ? meritAprs?.[maybeMeritSupplyKey as MeritSupplyKey]
    : 0
  return maybeMeritApr ?? 0
}
