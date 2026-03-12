import { useCallback, useMemo } from 'react'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { formatUnits } from 'viem'
import { WAD, WAD_SCALE } from '../../consts'
import { BenqiBorrowData } from '../../types'

export function useBenqiHealthScore({
  borrowData,
  direction
}: {
  borrowData: BenqiBorrowData | undefined
  direction: 'deposit' | 'withdraw'
}): {
  currentHealthScore: number | undefined
  calculateHealthScore: (amount: TokenUnit) => number | undefined
} {
  const currentHealthScore = useMemo(() => {
    if (!borrowData) return undefined
    const { liquidity, totalDebtUSD } = borrowData
    if (totalDebtUSD === 0n) return undefined
    const health = ((liquidity + totalDebtUSD) * WAD_SCALE) / totalDebtUSD
    return Number(formatUnits(health, WAD))
  }, [borrowData])

  const calculateHealthScore = useCallback(
    (amount: TokenUnit): number | undefined => {
      if (!borrowData) return undefined
      const { liquidity, totalDebtUSD, tokenPriceUSD, collateralFactor } =
        borrowData
      if (totalDebtUSD === 0n) return Infinity

      const amountUSD = (amount.toSubUnit() * tokenPriceUSD) / WAD_SCALE
      const collateralEffect = (amountUSD * collateralFactor) / WAD_SCALE

      const delta =
        direction === 'deposit' ? collateralEffect : -collateralEffect
      const rawLiquidity = liquidity + delta
      const newLiquidity = rawLiquidity > 0n ? rawLiquidity : 0n

      const newHealth =
        ((newLiquidity + totalDebtUSD) * WAD_SCALE) / totalDebtUSD
      return Number(formatUnits(newHealth, WAD))
    },
    [borrowData, direction]
  )

  return { currentHealthScore, calculateHealthScore }
}
