import { useCallback, useMemo } from 'react'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { formatUnits } from 'viem'
import { WAD, WAD_SCALE } from '../../consts'
import { AaveBorrowData } from '../../types'

export function useAaveHealthScore({
  borrowData,
  tokenDecimals,
  direction
}: {
  borrowData: AaveBorrowData | undefined
  tokenDecimals: number
  direction: 'deposit' | 'withdraw'
}): {
  currentHealthScore: number | undefined
  calculateHealthScore: (amount: TokenUnit) => number | undefined
} {
  const currentHealthScore = useMemo(() => {
    if (!borrowData || borrowData.totalDebtUSD === 0n) return undefined
    return Number(formatUnits(borrowData.healthFactor, WAD))
  }, [borrowData])

  const calculateHealthScore = useCallback(
    (amount: TokenUnit): number | undefined => {
      if (!borrowData) return undefined
      const {
        totalCollateralUSD,
        totalDebtUSD,
        liquidationThreshold,
        tokenPriceUSD
      } = borrowData
      if (totalDebtUSD === 0n) return Infinity

      const amountUSD =
        (amount.toSubUnit() * tokenPriceUSD) / 10n ** BigInt(tokenDecimals)

      const newCollateralUSD =
        direction === 'deposit'
          ? totalCollateralUSD + amountUSD
          : totalCollateralUSD > amountUSD
          ? totalCollateralUSD - amountUSD
          : 0n

      const newHealthFactor =
        (newCollateralUSD * liquidationThreshold * WAD_SCALE) /
        (totalDebtUSD * 10000n)
      return Number(formatUnits(newHealthFactor, WAD))
    },
    [borrowData, tokenDecimals, direction]
  )

  return { currentHealthScore, calculateHealthScore }
}
