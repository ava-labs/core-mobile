import React, { useCallback, useMemo, useState } from 'react'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { LoadingState } from 'common/components/LoadingState'
import {
  ActivityIndicator,
  Button,
  Icons,
  SendTokenUnitInputWidget,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { TokenUnit } from '@avalabs/core-utils-sdk/dist'
import { useSelector } from 'react-redux'
import { selectSelectedCurrency } from 'store/settings/currency'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import { transactionSnackbar } from 'common/utils/toast'
import { isUserRejectedError } from 'store/rpc/providers/walletConnect/utils'
import { HEALTH_SCORE_CAUTION_COLOR } from '../../consts'

export const BorrowSelectAmountFormBase = ({
  title = 'How much would you like to borrow?',
  token,
  availableToBorrow,
  currentHealthScore,
  calculateHealthScore,
  submit,
  onSubmitted,
  isLoading = false
}: {
  title?: string
  token: {
    decimals: number
    symbol: string
  }
  availableToBorrow: TokenUnit
  currentHealthScore?: number
  calculateHealthScore?: (borrowAmount: TokenUnit) => number | undefined
  submit: ({ amount }: { amount: TokenUnit }) => Promise<string>
  onSubmitted: (params: { txHash: string; amount: TokenUnit }) => void
  isLoading?: boolean
}): JSX.Element => {
  const { theme } = useTheme()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [amount, setAmount] = useState<TokenUnit>()
  const { getMarketTokenBySymbol } = useWatchlist()
  const selectedCurrency = useSelector(selectSelectedCurrency)

  const formatInCurrency = useCallback(
    (amt: TokenUnit, symbol: string): string => {
      const currentPrice = getMarketTokenBySymbol(symbol)?.currentPrice ?? 0
      return amt.mul(currentPrice).toDisplay() + ' ' + selectedCurrency
    },
    [getMarketTokenBySymbol, selectedCurrency]
  )

  // Calculate health score based on borrow amount
  const healthScore = useMemo(() => {
    if (!amount || amount.toSubUnit() === 0n) {
      return currentHealthScore
    }
    return calculateHealthScore?.(amount) ?? currentHealthScore
  }, [amount, currentHealthScore, calculateHealthScore])

  const validateAmount = useCallback(
    async (amt: TokenUnit) => {
      if (availableToBorrow && amt.gt(availableToBorrow)) {
        throw new Error('The specified amount exceeds available to borrow')
      }
    },
    [availableToBorrow]
  )

  const handleSubmit = useCallback(async () => {
    if (!amount) {
      return
    }

    try {
      setIsSubmitting(true)
      const txHash = await submit({ amount })
      onSubmitted({ txHash, amount })
    } catch (error) {
      // Don't show error toast if user rejected the transaction
      if (!isUserRejectedError(error)) {
        const errorMessage =
          error instanceof Error ? error.message : 'Transaction failed'
        transactionSnackbar.error({
          message: 'Transaction failed',
          error: errorMessage
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }, [amount, submit, onSubmitted])

  const canSubmit =
    !isSubmitting &&
    amount &&
    amount.gt(0) &&
    availableToBorrow &&
    (amount.lt(availableToBorrow) || amount?.eq(availableToBorrow))

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

  const formatHealthScore = useCallback((score: number | undefined): string => {
    if (score === undefined || Number.isNaN(score)) return '-'
    // AAVE returns a very large number when debt is 0 (effectively infinite)
    if (score > 1e10 || !Number.isFinite(score)) return '∞'
    return score.toFixed(2)
  }, [])

  // Health score color based on AAVE's convention:
  // > 3.0: Green (safe)
  // 1.1 - 3.0: Orange (caution)
  // < 1.1: Red (danger)
  const getHealthScoreColor = useCallback(
    (score: number | undefined): string => {
      if (score === undefined || Number.isNaN(score)) {
        return theme.colors.$textSecondary
      }
      if (score > 1e10 || !Number.isFinite(score) || score > 3) {
        return theme.colors.$textSuccess // Green
      }
      if (score >= 1.1) {
        return HEALTH_SCORE_CAUTION_COLOR
      }
      return theme.colors.$textDanger // Red
    },
    [theme.colors]
  )

  if (isLoading) {
    return <LoadingState sx={{ flex: 1 }} />
  }

  return (
    <ScrollScreen
      title={title}
      titleSx={{ maxWidth: '80%' }}
      isModal
      contentContainerStyle={{
        padding: 16,
        paddingTop: 0
      }}
      renderFooter={renderFooter}>
      <View sx={{ flex: 1 }}>
        <SendTokenUnitInputWidget
          sx={{ marginTop: 12 }}
          amount={amount}
          token={{
            maxDecimals: token.decimals,
            symbol: token.symbol
          }}
          balance={availableToBorrow}
          balanceLabel="Available to borrow:"
          formatInCurrency={amt => formatInCurrency(amt, token.symbol)}
          onChange={setAmount}
          validateAmount={validateAmount}
          disabled={isSubmitting}
          autoFocus
          maxAmount={availableToBorrow}
        />

        {/* Health Score Section */}
        <View
          sx={{
            marginTop: 24,
            backgroundColor: theme.colors.$surfaceSecondary,
            borderRadius: 12,
            overflow: 'hidden'
          }}>
          <View
            sx={{
              paddingHorizontal: 16,
              paddingVertical: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
            <Text variant="body1" sx={{ color: theme.colors.$textPrimary }}>
              Health score
            </Text>
            <View sx={{ alignItems: 'flex-end' }}>
              <Text
                variant="body1"
                sx={{
                  color: getHealthScoreColor(healthScore),
                  fontWeight: 500
                }}>
                {formatHealthScore(healthScore)}
              </Text>
              <Text
                variant="caption"
                sx={{ color: theme.colors.$textSecondary }}>
                Liquidation at {'<'}1.0
              </Text>
            </View>
          </View>
        </View>

        {/* Warning Section */}
        <View
          sx={{
            marginTop: 16,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8
          }}>
          <Icons.Alert.ErrorOutline
            width={24}
            height={24}
            color={theme.colors.$textPrimary}
          />
          <Text
            variant="body1"
            sx={{ color: '$textPrimary', flex: 1, fontWeight: 500 }}>
            Protocol changes can alter your health score and risk of liquidation
            at anytime
          </Text>
        </View>
      </View>
    </ScrollScreen>
  )
}
