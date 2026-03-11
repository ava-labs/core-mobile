import { useMemo } from 'react'
import { MarketNames } from '../../types'
import { useAvailableMarkets } from '../useAvailableMarkets'

/**
 * Detects Aave assets with LTV=0 that the user has enabled as collateral
 * with a positive deposited balance. When such assets exist and the user
 * has outstanding debt, borrow and withdraw operations will revert on-chain.
 */
export const useAaveZeroLtvCollateral = (): {
  zeroLtvSymbols: string[]
  blockingError: string | undefined
} => {
  const { data: markets } = useAvailableMarkets()

  return useMemo(() => {
    const symbols = markets
      .filter(
        m =>
          m.marketName === MarketNames.aave &&
          m.baseLTVasCollateral === 0n &&
          m.usageAsCollateralEnabledOnUser === true &&
          m.asset.mintTokenBalance.balance > 0n
      )
      .map(m => m.asset.symbol)

    const blockingError =
      symbols.length > 0
        ? `Assets with zero LTV (${symbols.join(
            ', '
          )}) must be withdrawn or disabled as collateral to perform this action`
        : undefined

    return { zeroLtvSymbols: symbols, blockingError }
  }, [markets])
}
