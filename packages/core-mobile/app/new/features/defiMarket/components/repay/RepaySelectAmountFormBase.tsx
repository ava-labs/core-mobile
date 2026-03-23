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
import Logger from 'utils/Logger'
import { BorrowPosition } from '../../types'
import { HealthScoreCard } from '../HealthScoreCard'

export type RepaySelectAmountFormBaseProps = {
  borrowPosition: BorrowPosition
  totalDebtUsd: number
  currentHealthScore: number | undefined
  /**
   * Wallet balance of the underlying asset (same decimals/symbol as the borrow).
   * Pass `useRepayTokenBalance(borrowPosition.market.asset, chainId)` after the
   * position is loaded — that hook returns a `TokenUnit` (including `0n` when the
   * wallet holds none) whenever `asset` is defined; do not render this form
   * without a resolved balance.
   */
  balance: TokenUnit
  formatInCurrency: (amt: TokenUnit, symbol: string) => string
  submit: (params: {
    amount: TokenUnit
    isMaxRepay: boolean
  }) => Promise<string>
  onSubmitted: (params: { txHash: string; amount: TokenUnit }) => void
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

  const calculateHealthScoreAfterRepay = useCallback(
    (repayAmount: TokenUnit): number | undefined => {
      if (currentHealthScore === undefined || Number.isNaN(currentHealthScore))
        return currentHealthScore

      if (totalDebtUsd <= 0) return undefined

      const pricePerToken = market.asset.mintTokenBalance.price.value.toNumber()
      const repayAmountUsd =
        repayAmount.toDisplay({ asNumber: true }) * pricePerToken

      const newTotalDebtUsd = Math.max(0, totalDebtUsd - repayAmountUsd)
      if (newTotalDebtUsd === 0) return Infinity

      return currentHealthScore * (totalDebtUsd / newTotalDebtUsd)
    },
    [currentHealthScore, totalDebtUsd, market]
  )

  const healthScoreAfterRepay = useMemo(() => {
    if (!amount) return currentHealthScore
    try {
      if (amount.toSubUnit() === 0n) return currentHealthScore

      // Full repay of this token — check if all debt would be cleared
      if (
        borrowedAmountUnit &&
        amount.toSubUnit() >= borrowedAmountUnit.toSubUnit()
      ) {
        const pricePerToken =
          market.asset.mintTokenBalance.price.value.toNumber()
        const tokenDebtUsd =
          borrowedAmountUnit.toDisplay({ asNumber: true }) * pricePerToken
        if (totalDebtUsd - tokenDebtUsd < 0.01) return Infinity
      }

      return calculateHealthScoreAfterRepay(amount)
    } catch {
      return currentHealthScore
    }
  }, [
    amount,
    currentHealthScore,
    calculateHealthScoreAfterRepay,
    borrowedAmountUnit,
    market,
    totalDebtUsd
  ])

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
      if (exceedsBalance(amt, balance)) {
        throw new Error('The specified amount exceeds your balance')
      }
      if (exceedsDebt(amt, borrowedAmountUnit)) {
        throw new Error('The specified amount exceeds your debt')
      }
    },
    [borrowedAmountUnit, balance]
  )

  const handleSubmit = useCallback(async () => {
    if (!amount) return

    const debtUnit = borrowedAmountUnit ?? new TokenUnit(0n, 0, '')
    const isMaxRepay = amount.gt(debtUnit) || amount.eq(debtUnit)

    try {
      setIsSubmitting(true)
      const txHash = await submit({ amount, isMaxRepay })
      onSubmitted({ txHash, amount })
    } catch (error) {
      if (!isUserRejectedError(error)) {
        Logger.error('[RepaySelectAmountFormBase] repay failed', error)
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
    !!amount &&
    amount.gt(0) &&
    borrowedAmountUnit !== undefined &&
    !exceedsDebt(amount, borrowedAmountUnit) &&
    !exceedsBalance(amount, balance)

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
          balance={balance}
          formatInCurrency={amt => formatInCurrency(amt, market.asset.symbol)}
          onChange={setAmount}
          validateAmount={validateAmount}
          disabled={isSubmitting}
          autoFocus
          maxAmount={borrowedAmountUnit}
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
          <HealthScoreCard
            score={healthScoreAfterRepay}
            currentScore={currentHealthScore}
          />
        </View>
      </View>
    </ScrollScreen>
  )
}

/** True when `amt` is strictly greater than wallet balance (only when balance is known). */
function exceedsBalance(
  amt: TokenUnit,
  balance: TokenUnit | undefined
): boolean {
  return balance !== undefined && amt.gt(balance)
}

/** True when `amt` is strictly greater than borrowed debt for this market. */
function exceedsDebt(amt: TokenUnit, debt: TokenUnit | undefined): boolean {
  return debt !== undefined && amt.gt(debt)
}
