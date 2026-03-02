import React, { useCallback, useMemo } from 'react'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { useSelector } from 'react-redux'
import { selectSelectedCurrency } from 'store/settings/currency'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import { LoadingState } from 'common/components/LoadingState'
import { ErrorState } from 'common/components/ErrorState'
import { useBenqiBorrowPositionsSummary } from '../../hooks/benqi/useBenqiBorrowPositionsSummary'
import { useBenqiRepay } from '../../hooks/benqi/useBenqiRepay'
import { useWalletBalanceForRepay } from '../../hooks/useWalletBalanceForRepay'
import { RepaySelectAmountFormBase } from './RepaySelectAmountFormBase'

export type BenqiRepaySelectAmountFormProps = {
  marketId: string
  onSubmitted: () => void
}

export function BenqiRepaySelectAmountForm({
  marketId,
  onSubmitted
}: BenqiRepaySelectAmountFormProps): JSX.Element {
  const benqiSummary = useBenqiBorrowPositionsSummary()
  const { getMarketTokenBySymbol } = useWatchlist()
  const selectedCurrency = useSelector(selectSelectedCurrency)

  const borrowPosition = useMemo(
    () =>
      benqiSummary.positions.find(p => p.market.uniqueMarketId === marketId),
    [marketId, benqiSummary.positions]
  )
  const walletBalance = useWalletBalanceForRepay(borrowPosition?.market.asset)

  const { benqiRepay } = useBenqiRepay({
    market: borrowPosition?.market
  })

  const formatInCurrency = useCallback(
    (amt: TokenUnit, symbol: string): string => {
      const currentPrice = getMarketTokenBySymbol(symbol)?.currentPrice ?? 0
      return amt.mul(currentPrice).toDisplay() + ' ' + selectedCurrency
    },
    [getMarketTokenBySymbol, selectedCurrency]
  )

  const totalDebtUsd = benqiSummary.positions.reduce(
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
    }) => benqiRepay({ amount, isMaxRepay }),
    [benqiRepay]
  )

  const isLoading = benqiSummary.isLoading && !borrowPosition
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
      currentHealthScore={benqiSummary.summary?.healthScore}
      walletBalance={walletBalance}
      formatInCurrency={formatInCurrency}
      submit={submit}
      onSubmitted={onSubmitted}
    />
  )
}
