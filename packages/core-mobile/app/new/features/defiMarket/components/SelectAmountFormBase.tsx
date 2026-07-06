import React, { useCallback, useMemo, useState } from 'react'
import { ScrollScreen } from 'common/components/ScrollScreen'
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
import { HealthScoreCard } from './HealthScoreCard'

export const SelectAmountFormBase = ({
  title = 'How much do you want to deposit?',
  token,
  tokenBalance,
  maxAmount,
  validateAmount,
  submit,
  onSubmitted,
  currentHealthScore,
  calculateHealthScore,
  balanceLabel,
  maxAmountZeroMessage,
  blockingError
}: {
  title?: string
  token: {
    decimals: number
    symbol: string
  }
  tokenBalance: TokenUnit
  maxAmount: TokenUnit | undefined
  validateAmount: (amount: TokenUnit) => Promise<void>
  submit: ({ amount }: { amount: TokenUnit }) => Promise<string>
  onSubmitted: (params: { txHash: string; amount: TokenUnit }) => void
  currentHealthScore?: number
  calculateHealthScore: (amount: TokenUnit) => number | undefined
  balanceLabel?: string
  maxAmountZeroMessage?: string
  blockingError?: string
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

  const healthScore = useMemo(() => {
    if (currentHealthScore === undefined) return undefined
    if (!amount || amount.toSubUnit() === 0n) return currentHealthScore
    try {
      return calculateHealthScore(amount)
    } catch {
      return currentHealthScore
    }
  }, [amount, currentHealthScore, calculateHealthScore])

  const effectiveMax = maxAmount ?? tokenBalance
  const canSubmit =
    !isSubmitting &&
    !blockingError &&
    amount &&
    amount.gt(0) &&
    effectiveMax &&
    (amount.lt(effectiveMax) || amount.eq(effectiveMax))

  const renderFooter = useCallback(() => {
    return (
      <Button
        testID={canSubmit ? 'next_btn' : 'next_btn_disabled'}
        size="large"
        type="primary"
        onPress={handleSubmit}
        disabled={!canSubmit}>
        {isSubmitting ? <ActivityIndicator size="small" /> : 'Next'}
      </Button>
    )
  }, [handleSubmit, isSubmitting, canSubmit])

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
          balance={balanceLabel ? maxAmount ?? tokenBalance : tokenBalance}
          formatInCurrency={amt => formatInCurrency(amt, token.symbol)}
          onChange={setAmount}
          validateAmount={validateAmount}
          disabled={isSubmitting}
          autoFocus
          presetPercentages={[25, 50]}
          maxAmount={maxAmount}
          balanceLabel={balanceLabel}
          maxAmountZeroMessage={maxAmountZeroMessage}
        />
        {currentHealthScore !== undefined && (
          <View sx={{ marginTop: 24 }}>
            <HealthScoreCard
              score={healthScore}
              currentScore={currentHealthScore}
            />
          </View>
        )}
        {blockingError && (
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
              color={theme.colors.$textDanger}
            />
            <Text
              variant="body1"
              sx={{
                color: '$textDanger',
                flex: 1,
                fontFamily: 'Inter-Medium'
              }}>
              {blockingError}
            </Text>
          </View>
        )}
      </View>
    </ScrollScreen>
  )
}
