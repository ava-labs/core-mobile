import { TokenUnit } from '@avalabs/core-utils-sdk'
import {
  ActivityIndicator,
  Button,
  GroupList,
  type GroupListItem,
  Text,
  TokenUnitInputWidget,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { showSnackbar } from 'common/utils/toast'
import { useRouter } from 'expo-router'
import { isUserRejectionError } from 'features/swap/utils/fusionErrors'
import React, { useCallback, useMemo, useState } from 'react'
import { formatNumber } from 'utils/formatNumber/formatNumber'
import { USDC_DECIMALS } from '../consts'
import { PerpsApiDownState } from '../components/PerpsApiDownState'
import { usePerpsWithdraw } from '../hooks/usePerpsWithdraw'
import {
  floorToCents,
  floorToUsdcUnit,
  usdcAmountFromTokenUnit
} from '../utils/usdcAmount'

const USDC_TOKEN = { maxDecimals: USDC_DECIMALS, symbol: 'USDC' }

const toUsdc = (amount: number): TokenUnit =>
  new TokenUnit(
    Math.round(amount * 10 ** USDC_DECIMALS),
    USDC_DECIMALS,
    USDC_TOKEN.symbol
  )

const DASH = '—'

const formatUsdcAmount = (amount: number): string =>
  `${formatNumber(amount)} USDC`
const formatUsd = (amount: number): string => `$${formatNumber(amount)} USD`

export const PerpetualsWithdrawScreen = (): JSX.Element => {
  const router = useRouter()
  const { theme } = useTheme()
  const [amount, setAmount] = useState<number>(0)

  const {
    withdrawableUsd,
    isWithdrawableLoading,
    refetchWithdrawable,
    bestQuote,
    isQuoting,
    canWithdraw,
    isWithdrawing,
    exceedsWithdrawable,
    estimatedReceive,
    executeWithdraw
  } = usePerpsWithdraw(amount > 0 ? String(amount) : '')

  const available = withdrawableUsd
  // Floored, so Max never fills a hair more than the true withdrawable.
  const availableBalance = useMemo(
    () => (available === undefined ? undefined : floorToUsdcUnit(available)),
    [available]
  )

  const handleAmountChange = useCallback((value: TokenUnit): void => {
    setAmount(usdcAmountFromTokenUnit(value))
  }, [])

  const formatInCurrency = useCallback(
    (value: TokenUnit): string =>
      formatUsd(value.toDisplay({ asNumber: true })),
    []
  )

  const hasInput = amount > 0
  const exceedsBalance = exceedsWithdrawable

  // Fee and receive come only from the live bridge quote — no fabricated
  // fallback. Until a quote resolves they render as a dash / "Calculating…".
  const feeUsdc =
    estimatedReceive !== undefined
      ? Math.max(0, amount - estimatedReceive)
      : undefined

  const handleSubmit = useCallback(async () => {
    if (bestQuote === undefined) {
      return
    }
    try {
      await executeWithdraw(bestQuote)
      showSnackbar('Withdrawal submitted')
      router.back()
    } catch (e) {
      if (isUserRejectionError(e)) {
        return
      }
      showSnackbar(e instanceof Error ? e.message : 'Withdrawal failed')
    }
  }, [bestQuote, executeWithdraw, router])

  const footerLabel = isWithdrawing
    ? 'Withdrawing...'
    : isQuoting
    ? 'Getting quote...'
    : 'Withdraw'

  const renderFooter = useCallback(
    () => (
      <Button
        type="primary"
        size="large"
        disabled={!hasInput || !canWithdraw || isWithdrawing}
        onPress={handleSubmit}>
        {footerLabel}
      </Button>
    ),
    [hasInput, canWithdraw, isWithdrawing, footerLabel, handleSubmit]
  )

  const mutedValue = useCallback(
    (text: string): JSX.Element => (
      <Text variant="body1" sx={{ color: '$textSecondary' }}>
        {text}
      </Text>
    ),
    []
  )

  const availableRow: GroupListItem[] = useMemo(
    () =>
      available === undefined
        ? []
        : [
            {
              title: 'Available to withdraw',
              // Floored to cents: half-up 2dp formatting must not overstate.
              value: mutedValue(formatUsd(floorToCents(available)))
            }
          ],
    [mutedValue, available]
  )

  const breakdown: GroupListItem[] = useMemo(
    () => [
      {
        title: 'Withdrawal amount',
        value: (
          <View sx={{ alignItems: 'flex-end' }}>
            <Text variant="body1" sx={{ color: '$textSecondary' }}>
              {formatUsdcAmount(amount)}
            </Text>
            <Text variant="caption" sx={{ color: '$textSecondary' }}>
              {formatUsd(amount)}
            </Text>
          </View>
        )
      },
      {
        title: 'Conversion rate',
        value: mutedValue('1 USDC = $1.00 USD')
      },
      {
        title: 'Fees',
        value:
          feeUsdc !== undefined ? (
            <View sx={{ alignItems: 'flex-end' }}>
              <Text variant="body1" sx={{ color: '$textSecondary' }}>
                {formatUsdcAmount(feeUsdc)}
              </Text>
              <Text variant="caption" sx={{ color: '$textSecondary' }}>
                {formatUsd(feeUsdc)}
              </Text>
            </View>
          ) : (
            mutedValue(isQuoting ? 'Calculating…' : DASH)
          )
      },
      {
        title: "You'll receive",
        value: mutedValue(
          estimatedReceive !== undefined
            ? formatUsdcAmount(estimatedReceive)
            : isQuoting
            ? 'Calculating…'
            : DASH
        )
      }
    ],
    [amount, estimatedReceive, feeUsdc, isQuoting, mutedValue]
  )

  if (available === undefined && isWithdrawableLoading) {
    return (
      <ScrollScreen
        isModal
        title="How much do you want to withdraw?"
        navigationTitle="Enter withdraw amount"
        contentContainerStyle={{ flexGrow: 1 }}>
        <View
          testID="perps-withdrawable-loading"
          sx={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={theme.colors.$textPrimary} />
        </View>
      </ScrollScreen>
    )
  }

  if (available === undefined || availableBalance === undefined) {
    return (
      <ScrollScreen
        isModal
        title="How much do you want to withdraw?"
        navigationTitle="Enter withdraw amount"
        contentContainerStyle={{ flexGrow: 1 }}>
        <PerpsApiDownState onRetry={refetchWithdrawable} />
      </ScrollScreen>
    )
  }

  return (
    <ScrollScreen
      renderFooter={renderFooter}
      shouldAvoidKeyboard
      isModal
      bottomOffset={-700}
      title="How much do you want to withdraw?"
      subtitle="Move trading funds from your balance to your wallet"
      navigationTitle="Enter withdraw amount"
      contentContainerStyle={{ padding: 16, gap: 20 }}>
      <View sx={{ gap: 12, alignItems: 'center' }}>
        <TokenUnitInputWidget
          sx={{ width: '100%' }}
          autoFocus
          token={USDC_TOKEN}
          balance={availableBalance}
          amount={amount > 0 ? toUsdc(amount) : undefined}
          onChange={handleAmountChange}
          formatInCurrency={formatInCurrency}
          valid={!exceedsBalance}
        />

        {exceedsBalance ? (
          <Text variant="caption" sx={{ color: '$textDanger' }}>
            {/* Floored to cents so the hint never names a rejected amount. */}
            {`Maximum withdrawal is ${formatUsdcAmount(
              floorToCents(available)
            )}`}
          </Text>
        ) : null}
      </View>

      <GroupList data={availableRow} />
      <GroupList data={breakdown} />
    </ScrollScreen>
  )
}
