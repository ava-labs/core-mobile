import React, { useCallback, useMemo } from 'react'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { useSelector } from 'react-redux'
import { selectSelectedCurrency } from 'store/settings/currency'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import { LoadingState } from 'common/components/LoadingState'
import { ErrorState } from 'common/components/ErrorState'
import { useCChainGasCost } from 'common/hooks/useCChainGasCost'
import { useTokenBalance } from 'common/hooks/useTokenBalance'
import useCChainNetwork from 'hooks/earn/useCChainNetwork'
import { useAaveBorrowPositionsSummary } from '../../hooks/aave/useAaveBorrowPositionsSummary'
import { useAaveRepay } from '../../hooks/aave/useAaveRepay'
import {
  REPAY_ETH_FALLBACK_GAS_RESERVE,
  REPAY_ETH_GAS_AMOUNT
} from '../../consts'
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

  const rawWalletBalance = useTokenBalance(
    borrowPosition?.market.asset,
    cChainNetwork?.chainId
  )
  const { gasCost: repayEthGasCost } = useCChainGasCost({
    gasAmount: REPAY_ETH_GAS_AMOUNT,
    keyPrefix: 'aave-repay-eth'
  })

  // For native AVAX: reserve gas + buffer in wallet - contract refunds excess
  const isNativeAvax = !borrowPosition?.market.asset.contractAddress
  const walletBalance = useMemo(() => {
    if (!rawWalletBalance) return undefined
    if (!isNativeAvax) return rawWalletBalance
    const gasReserve = repayEthGasCost ?? REPAY_ETH_FALLBACK_GAS_RESERVE
    const balanceSubUnit = rawWalletBalance.toSubUnit()
    const afterGas =
      balanceSubUnit > gasReserve ? balanceSubUnit - gasReserve : 0n
    return new TokenUnit(
      afterGas,
      rawWalletBalance.getMaxDecimals(),
      rawWalletBalance.getSymbol()
    )
  }, [rawWalletBalance, isNativeAvax, repayEthGasCost])

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
      walletBalance={walletBalance}
      formatInCurrency={formatInCurrency}
      submit={submit}
      onSubmitted={onSubmitted}
    />
  )
}
