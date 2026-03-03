import React, { useCallback, useMemo } from 'react'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { useSelector } from 'react-redux'
import { selectSelectedCurrency } from 'store/settings/currency'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import { LoadingState } from 'common/components/LoadingState'
import { ErrorState } from 'common/components/ErrorState'
import { useTokenBalance } from 'common/hooks/useTokenBalance'
import useCChainNetwork from 'hooks/earn/useCChainNetwork'
import { useAaveBorrowPositionsSummary } from '../../hooks/aave/useAaveBorrowPositionsSummary'
import { useAaveRepay } from '../../hooks/aave/useAaveRepay'
import { RepaySelectAmountFormBase } from './RepaySelectAmountFormBase'

export type AaveRepaySelectAmountFormProps = {
  marketId: string
  onSubmitted: () => void
}

export function AaveRepaySelectAmountForm({
  marketId,
  onSubmitted
}: AaveRepaySelectAmountFormProps): JSX.Element {
  const aaveSummary = useAaveBorrowPositionsSummary()
  const { getMarketTokenBySymbol } = useWatchlist()
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const cChainNetwork = useCChainNetwork()

  const borrowPosition = useMemo(
    () => aaveSummary.positions.find(p => p.market.uniqueMarketId === marketId),
    [marketId, aaveSummary.positions]
  )

  const balance = useTokenBalance(
    borrowPosition?.market.asset,
    cChainNetwork?.chainId
  )

  const { aaveRepay } = useAaveRepay({
    market: borrowPosition?.market
  })

  const formatInCurrency = useCallback(
    (amt: TokenUnit, symbol: string): string => {
      const currentPrice = getMarketTokenBySymbol(symbol)?.currentPrice ?? 0
      return amt.mul(currentPrice).toDisplay() + ' ' + selectedCurrency
    },
    [getMarketTokenBySymbol, selectedCurrency]
  )

  const totalDebtUsd = aaveSummary.positions.reduce(
    (sum, p) => sum + p.borrowedAmountUsd,
    0
  )

  const submit = useCallback(
    async ({
      amount,
      isMaxRepay
    }: {
      amount: TokenUnit
      isMaxRepay: boolean
    }) => aaveRepay({ amount, isMaxRepay }),
    [aaveRepay]
  )

  const isLoading = aaveSummary.isLoading && !borrowPosition
  if (isLoading) {
    return <LoadingState sx={{ flex: 1 }} />
  }
  if (!borrowPosition) {
    return (
      <ErrorState
        sx={{ flex: 1 }}
        title="Position not found"
        description="Unable to load borrow position"
      />
    )
  }

  return (
    <RepaySelectAmountFormBase
      borrowPosition={borrowPosition}
      totalDebtUsd={totalDebtUsd}
      currentHealthScore={aaveSummary.summary?.healthScore}
      balance={balance}
      formatInCurrency={formatInCurrency}
      submit={submit}
      onSubmitted={onSubmitted}
    />
  )
}
