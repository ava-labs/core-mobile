import {
  Button,
  FiatAmountInputWidget,
  GroupList,
  type GroupListItem,
  Text,
  View
} from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useRouter } from 'expo-router'
import React, { useCallback, useMemo, useState } from 'react'
import { formatNumber } from 'utils/formatNumber/formatNumber'

// Stubs until we wire the real Hyperliquid clearinghouse-derived values.
const AVAILABLE_USDC = 1234.45
const PENDING_SETTLEMENTS_USDC = 439.54
const PENDING_POSITION_COUNT = 3
const FEE_USDC = 0.5

const formatUsdcAmount = (amount: number): string =>
  `${formatNumber(amount)} USDC`
const formatUsdInteger = (amount: number): string => formatNumber(amount)
const formatUsd = (amount: number): string => `$${formatNumber(amount)} USD`

export const PerpetualsWithdrawScreen = (): JSX.Element => {
  const router = useRouter()
  const [amount, setAmount] = useState<number>(0)

  const hasInput = amount > 0
  const exceedsBalance = amount > AVAILABLE_USDC
  const isValid = hasInput && !exceedsBalance

  const youReceive = Math.max(0, amount - FEE_USDC)

  const handleSubmit = useCallback(() => {
    // TODO: real withdraw submission (Hyperliquid → C-Chain via SDK).
    router.back()
  }, [router])

  const renderFooter = useCallback(
    () => (
      <Button
        type="primary"
        size="large"
        disabled={!isValid}
        onPress={handleSubmit}>
        Withdraw
      </Button>
    ),
    [isValid, handleSubmit]
  )

  const presets = useMemo(() => {
    const round = (n: number): number => Number(n.toFixed(5))
    return [
      { label: '25%', value: round(AVAILABLE_USDC * 0.25) },
      { label: '50%', value: round(AVAILABLE_USDC * 0.5) },
      { label: 'Max', value: round(AVAILABLE_USDC) }
    ]
  }, [])

  const formatInSubTextNumber = useCallback(
    (n: number): JSX.Element => (
      <Text
        variant="caption"
        sx={{ color: '$textSecondary', marginTop: -8, marginBottom: 8 }}>
        {formatUsd(n)}
      </Text>
    ),
    []
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
    () => [
      {
        title: 'Available to withdraw',
        value: mutedValue(formatUsd(AVAILABLE_USDC)),
        accordion: (
          <View
            sx={{
              paddingHorizontal: 16,
              paddingVertical: 12,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12
            }}>
            <View sx={{ gap: 2, flex: 1 }}>
              <Text variant="body1">Pending settlements</Text>
              <Text variant="caption" sx={{ color: '$textSecondary' }}>
                {`Locked in ${PENDING_POSITION_COUNT} active position${
                  PENDING_POSITION_COUNT > 1 ? 's' : ''
                }.`}
              </Text>
              <Text variant="caption" sx={{ color: '$textSecondary' }}>
                Available after markets end.
              </Text>
            </View>
            <Text variant="body1" sx={{ color: '$textSecondary' }}>
              {formatUsd(PENDING_SETTLEMENTS_USDC)}
            </Text>
          </View>
        )
      }
    ],
    [mutedValue]
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
        value: (
          <View sx={{ alignItems: 'flex-end' }}>
            <Text variant="body1" sx={{ color: '$textSecondary' }}>
              {formatUsdcAmount(FEE_USDC)}
            </Text>
            <Text variant="caption" sx={{ color: '$textSecondary' }}>
              {formatUsd(FEE_USDC)}
            </Text>
          </View>
        )
      },
      {
        title: "You'll receive",
        value: mutedValue(formatUsdcAmount(youReceive))
      }
    ],
    [amount, youReceive, mutedValue]
  )

  return (
    <ScrollScreen
      renderFooter={renderFooter}
      shouldAvoidKeyboard
      isModal
      navigationTitle="How much do you want to withdraw?"
      contentContainerStyle={{ padding: 16, gap: 20 }}>
      <View sx={{ gap: 8, paddingTop: 8 }}>
        <Text variant="heading2">How much do you want to withdraw?</Text>
        <Text variant="subtitle1" sx={{ color: '$textSecondary' }}>
          Move trading funds from your balance to your wallet
        </Text>
      </View>

      <FiatAmountInputWidget
        autoFocus
        currency="USDC"
        amount={amount}
        isAmountValid={!exceedsBalance}
        onChange={setAmount}
        formatInCurrency={formatUsdcAmount}
        formatIntegerCurrency={formatUsdInteger}
        formatInSubTextNumber={formatInSubTextNumber}
        presets={presets}
        subTextPosition="bottom"
        trailingCurrencyMaxFontSize={24}
        returnKeyType="none"
      />

      <GroupList data={availableRow} />
      <GroupList data={breakdown} />
    </ScrollScreen>
  )
}
