import React, { useCallback, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Button,
  Card,
  SendTokenUnitInputWidget,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { LoadingState } from 'common/components/LoadingState'
import { ErrorState } from 'common/components/ErrorState'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { useSelector } from 'react-redux'
import { transactionSnackbar } from 'common/utils/toast'
import { isUserRejectedError } from 'store/rpc/providers/walletConnect/utils'
import { selectSelectedCurrency } from 'store/settings/currency'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { DefiMarket, MarketNames } from '../../types'
import { HEALTH_SCORE_CAUTION_COLOR } from '../../consts'
import { formatHealthScore } from '../../utils/healthRisk'
import { useAaveBorrowPositionsSummary } from '../../hooks/aave/useAaveBorrowPositionsSummary'
import { useBenqiBorrowPositionsSummary } from '../../hooks/benqi/useBenqiBorrowPositionsSummary'
import { useWalletBalanceForRepay } from '../../hooks/useWalletBalanceForRepay'
import { useAaveRepay } from '../../hooks/aave/useAaveRepay'
import { useBenqiRepay } from '../../hooks/benqi/useBenqiRepay'

const MIN_DEBT_USD_THRESHOLD = 1e-6

export function RepaySelectAmountScreen(): JSX.Element {
  const { theme } = useTheme()
  const router = useRouter()
  const { marketId, protocol } = useLocalSearchParams<{
    marketId: string
    protocol: string
  }>()

  const [amount, setAmount] = useState<TokenUnit>()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { getMarketTokenBySymbol } = useWatchlist()
  const selectedCurrency = useSelector(selectSelectedCurrency)

  const aaveSummary = useAaveBorrowPositionsSummary()
  const benqiSummary = useBenqiBorrowPositionsSummary()

  const positions =
    protocol === MarketNames.aave
      ? aaveSummary.positions
      : benqiSummary.positions

  const borrowPosition = useMemo(
    () => positions.find(p => p.market.uniqueMarketId === marketId),
    [marketId, positions]
  )

  const totalDebtUsd = useMemo(
    () => positions.reduce((sum, p) => sum + p.borrowedAmountUsd, 0),
    [positions]
  )

  const isLoading =
    (protocol === MarketNames.aave
      ? aaveSummary.isLoading
      : benqiSummary.isLoading) && !borrowPosition

  const walletBalance = useWalletBalanceForRepay(borrowPosition?.market.asset)

  const borrowedAmountUnit = useMemo(() => {
    if (!borrowPosition) return undefined
    const { market, borrowedBalance } = borrowPosition
    return new TokenUnit(
      borrowedBalance,
      market.asset.decimals,
      market.asset.symbol
    )
  }, [borrowPosition])

  const maxRepayAmount = useMemo(() => {
    if (!borrowedAmountUnit || !walletBalance) return borrowedAmountUnit
    return borrowedAmountUnit.lt(walletBalance)
      ? borrowedAmountUnit
      : walletBalance
  }, [borrowedAmountUnit, walletBalance])

  const formatInCurrency = useCallback(
    (amt: TokenUnit, symbol: string): string => {
      const currentPrice = getMarketTokenBySymbol(symbol)?.currentPrice ?? 0
      return amt.mul(currentPrice).toDisplay() + ' ' + selectedCurrency
    },
    [getMarketTokenBySymbol, selectedCurrency]
  )

  const dismissRepayModal = useCallback(() => {
    if (router.canDismiss()) {
      router.dismiss()
    } else if (router.canGoBack()) {
      router.back()
    }
  }, [router])

  const aaveRepay = useAaveRepay({
    market: borrowPosition?.market ?? ({} as DefiMarket)
  })

  const benqiRepay = useBenqiRepay({
    market: borrowPosition?.market ?? ({} as DefiMarket)
  })

  const currentHealthScore = useMemo(() => {
    if (protocol === MarketNames.aave) {
      return aaveSummary.summary?.healthScore
    }
    return benqiSummary.summary?.healthScore
  }, [protocol, aaveSummary.summary, benqiSummary.summary])

  const calculateHealthScoreAfterRepay = useCallback(
    (repayAmount: TokenUnit): number | undefined => {
      if (!borrowPosition || !currentHealthScore) return currentHealthScore

      if (totalDebtUsd <= 0) return undefined

      const pricePerToken =
        borrowPosition.market.asset.mintTokenBalance.price.value.toNumber()
      const repayAmountUsd =
        (Number(repayAmount.toSubUnit()) * pricePerToken) /
        10 ** borrowPosition.market.asset.decimals

      const newTotalDebtUsd = Math.max(0, totalDebtUsd - repayAmountUsd)
      // Avoid division by near-zero (floating point precision) → treat as full repay
      if (newTotalDebtUsd <= MIN_DEBT_USD_THRESHOLD) return Infinity

      return currentHealthScore * (totalDebtUsd / newTotalDebtUsd)
    },
    [borrowPosition, currentHealthScore, totalDebtUsd]
  )

  const healthScoreAfterRepay = useMemo(() => {
    if (!amount) return currentHealthScore
    try {
      if (amount.toSubUnit() === 0n) return currentHealthScore
      return calculateHealthScoreAfterRepay(amount)
    } catch {
      return currentHealthScore
    }
  }, [amount, currentHealthScore, calculateHealthScoreAfterRepay])

  const remainingDebt = useMemo(() => {
    if (!borrowedAmountUnit || !amount) return borrowedAmountUnit
    try {
      const debtRaw = borrowedAmountUnit.toSubUnit()
      const repayRaw = amount.toSubUnit()
      const remainingRaw = debtRaw >= repayRaw ? debtRaw - repayRaw : 0n
      // Use string to avoid Big.js "Invalid exponent" with large bigint
      return new TokenUnit(
        remainingRaw.toString(),
        borrowedAmountUnit.getMaxDecimals(),
        borrowedAmountUnit.getSymbol()
      )
    } catch {
      return borrowedAmountUnit
    }
  }, [borrowedAmountUnit, amount])

  const getHealthScoreColor = useCallback(
    (score: number | undefined): string => {
      if (score === undefined || Number.isNaN(score)) {
        return theme.colors.$textSecondary
      }
      if (score > 1e10 || !Number.isFinite(score) || score > 3) {
        return theme.colors.$textSuccess
      }
      if (score >= 1.1) {
        return HEALTH_SCORE_CAUTION_COLOR
      }
      return theme.colors.$textDanger
    },
    [theme.colors]
  )

  const validateAmount = useCallback(
    async (amt: TokenUnit) => {
      if (!maxRepayAmount || amt.gt(maxRepayAmount)) {
        throw new Error('The specified amount exceeds available to repay')
      }
      if (!borrowedAmountUnit || amt.gt(borrowedAmountUnit)) {
        throw new Error('The specified amount exceeds your debt')
      }
    },
    [maxRepayAmount, borrowedAmountUnit]
  )

  const handleSubmit = useCallback(async () => {
    if (!amount || !borrowPosition) return

    const debtUnit = borrowedAmountUnit ?? new TokenUnit(0n, 0, '')
    const isMaxRepay = amount.gt(debtUnit) || amount.eq(debtUnit)

    try {
      setIsSubmitting(true)
      if (protocol === MarketNames.aave) {
        await aaveRepay.aaveRepay({ amount, isMaxRepay })
      } else {
        await benqiRepay.benqiRepay({ amount, isMaxRepay })
      }
      dismissRepayModal()
    } catch (error) {
      if (!isUserRejectedError(error)) {
        transactionSnackbar.error({
          message: 'Transaction failed',
          error: error instanceof Error ? error.message : 'Transaction failed'
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }, [
    amount,
    borrowPosition,
    borrowedAmountUnit,
    protocol,
    aaveRepay,
    benqiRepay,
    dismissRepayModal
  ])

  const canSubmit =
    !isSubmitting &&
    amount &&
    amount.gt(0) &&
    maxRepayAmount &&
    (amount.lt(maxRepayAmount) || amount.eq(maxRepayAmount))

  const renderFooter = useCallback(() => {
    return (
      <Button
        size="large"
        type="primary"
        onPress={handleSubmit}
        disabled={!canSubmit}>
        {isSubmitting ? <ActivityIndicator size="small" /> : 'Next'}
      </Button>
    )
  }, [handleSubmit, isSubmitting, canSubmit])

  if (isLoading || !borrowPosition) {
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

  const { market } = borrowPosition

  return (
    <ScrollScreen
      title="How much do you want to repay?"
      titleSx={{ maxWidth: '90%' }}
      isModal
      contentContainerStyle={{ padding: 16 }}
      renderFooter={renderFooter}>
      <View sx={{ flex: 1 }}>
        <SendTokenUnitInputWidget
          sx={{ marginTop: 12 }}
          amount={amount}
          token={{
            maxDecimals: market.asset.decimals,
            symbol: market.asset.symbol
          }}
          balance={
            walletBalance ??
            new TokenUnit(0n, market.asset.decimals, market.asset.symbol)
          }
          formatInCurrency={amt => formatInCurrency(amt, market.asset.symbol)}
          onChange={setAmount}
          validateAmount={validateAmount}
          disabled={isSubmitting}
          autoFocus
          maxAmount={maxRepayAmount}
          presetPercentages={[25, 50]}
        />

        <View sx={{ marginTop: 24, gap: 12 }}>
          <Card sx={{ padding: 16 }}>
            <View
              sx={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12
              }}>
              <Text
                variant="body1"
                sx={{ color: '$textPrimary', flexShrink: 0 }}>
                Remaining debt
              </Text>
              <View sx={{ flex: 1, alignItems: 'flex-end', gap: 2 }}>
                <Text
                  variant="body1"
                  sx={{
                    color: '$textPrimary',
                    fontWeight: 500
                  }}>
                  {remainingDebt?.toDisplay() ?? UNKNOWN_AMOUNT}{' '}
                  {market.asset.symbol}
                </Text>
                <Text variant="caption" sx={{ color: '$textSecondary' }}>
                  {remainingDebt
                    ? formatInCurrency(remainingDebt, market.asset.symbol)
                    : UNKNOWN_AMOUNT}
                </Text>
              </View>
            </View>
          </Card>
          <Card sx={{ padding: 16 }}>
            <View
              sx={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12
              }}>
              <Text
                variant="body1"
                sx={{ color: '$textPrimary', flexShrink: 0 }}>
                Health score
              </Text>
              <View sx={{ flex: 1, alignItems: 'flex-end', gap: 2 }}>
                <Text
                  variant="body1"
                  sx={{
                    color: getHealthScoreColor(healthScoreAfterRepay),
                    fontWeight: 500
                  }}>
                  {formatHealthScore(healthScoreAfterRepay)}
                </Text>
                <Text variant="caption" sx={{ color: '$textSecondary' }}>
                  Liquidation at {'<'}1.0
                </Text>
              </View>
            </View>
          </Card>
        </View>
      </View>
    </ScrollScreen>
  )
}
