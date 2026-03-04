import React, { useCallback, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Button,
  Card,
  SendTokenUnitInputWidget,
  Text,
  View
} from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { transactionSnackbar } from 'common/utils/toast'
import { isUserRejectedError } from 'store/rpc/providers/walletConnect/utils'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { BorrowPosition } from '../../types'
import { HealthScoreCard } from '../HealthScoreCard'

const MIN_DEBT_USD_THRESHOLD = 1e-6

export type RepaySelectAmountFormBaseProps = {
  borrowPosition: BorrowPosition
  totalDebtUsd: number
  currentHealthScore: number | undefined
  balance: TokenUnit | undefined
  formatInCurrency: (amt: TokenUnit, symbol: string) => string
  submit: (params: {
    amount: TokenUnit
    isMaxRepay: boolean
  }) => Promise<string>
  onSubmitted: () => void
}

export function RepaySelectAmountFormBase({
  borrowPosition,
  totalDebtUsd,
  currentHealthScore,
  balance,
  formatInCurrency,
  submit,
  onSubmitted
}: RepaySelectAmountFormBaseProps): JSX.Element {
  const [amount, setAmount] = useState<TokenUnit>()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { market } = borrowPosition

  const borrowedAmountUnit = useMemo(() => {
    const { borrowedBalance } = borrowPosition
    return new TokenUnit(
      borrowedBalance,
      market.asset.decimals,
      market.asset.symbol
    )
  }, [borrowPosition, market])

  const maxRepayAmount = useMemo(() => {
    if (!borrowedAmountUnit || !balance) return borrowedAmountUnit
    return borrowedAmountUnit.lt(balance) ? borrowedAmountUnit : balance
  }, [borrowedAmountUnit, balance])

  const calculateHealthScoreAfterRepay = useCallback(
    (repayAmount: TokenUnit): number | undefined => {
      if (!currentHealthScore) return currentHealthScore

      if (totalDebtUsd <= 0) return undefined

      const pricePerToken = market.asset.mintTokenBalance.price.value.toNumber()
      const repayAmountUsd =
        (Number(repayAmount.toSubUnit()) * pricePerToken) /
        10 ** market.asset.decimals

      const newTotalDebtUsd = Math.max(0, totalDebtUsd - repayAmountUsd)
      if (newTotalDebtUsd <= MIN_DEBT_USD_THRESHOLD) return Infinity

      return currentHealthScore * (totalDebtUsd / newTotalDebtUsd)
    },
    [currentHealthScore, totalDebtUsd, market]
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
      return new TokenUnit(
        remainingRaw.toString(),
        borrowedAmountUnit.getMaxDecimals(),
        borrowedAmountUnit.getSymbol()
      )
    } catch {
      return borrowedAmountUnit
    }
  }, [borrowedAmountUnit, amount])

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
    if (!amount) return

    const debtUnit = borrowedAmountUnit ?? new TokenUnit(0n, 0, '')
    const isMaxRepay = amount.gt(debtUnit) || amount.eq(debtUnit)

    try {
      setIsSubmitting(true)
      await submit({ amount, isMaxRepay })
      onSubmitted()
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
  }, [amount, borrowedAmountUnit, submit, onSubmitted])

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
            balance ??
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
          <HealthScoreCard score={healthScoreAfterRepay} />
        </View>
      </View>
    </ScrollScreen>
  )
}
