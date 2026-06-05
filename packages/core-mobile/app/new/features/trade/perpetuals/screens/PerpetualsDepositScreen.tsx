import { Button, FiatAmountInputWidget, Text, View } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useRouter } from 'expo-router'
import React, { useCallback, useState } from 'react'
import { formatNumber } from 'utils/formatNumber/formatNumber'

const MIN_DEPOSIT_USDC = 10
// Stub until we wire the real USDC wallet balance (C-Chain ERC-20).
const WALLET_USDC_BALANCE = 28.1142

const DEPOSIT_PRESETS = [
  { label: '$100', value: 100 },
  { label: '$250', value: 250 },
  { label: '$500', value: 500 }
] as const

const formatUsdcAmount = (amount: number): string =>
  `${formatNumber(amount)} USDC`

const formatUsdInteger = (amount: number): string => formatNumber(amount)

const formatWalletUsdc = (amount: number): string =>
  `${formatNumber(amount)} USDC`

export const PerpetualsDepositScreen = (): JSX.Element => {
  const router = useRouter()
  const [amount, setAmount] = useState(0)

  const hasInput = amount > 0
  const isBelowMin = hasInput && amount < MIN_DEPOSIT_USDC
  const isValid = amount >= MIN_DEPOSIT_USDC

  const handleSubmit = useCallback(() => {
    // TODO: real deposit submission (USDC contract / Hyperliquid agent flow).
    router.back()
  }, [router])

  const renderFooter = useCallback(
    () => (
      <Button
        type="primary"
        size="large"
        disabled={!isValid}
        onPress={handleSubmit}>
        Deposit funds
      </Button>
    ),
    [isValid, handleSubmit]
  )

  const formatInSubTextNumber = useCallback(
    (n: number): JSX.Element => (
      <Text
        variant="caption"
        sx={{
          color: isBelowMin ? '$textDanger' : '$textSecondary',
          marginTop: -8,
          marginBottom: 8
        }}>
        {`$${formatNumber(n)} USD`}
      </Text>
    ),
    [isBelowMin]
  )

  return (
    <ScrollScreen
      renderFooter={renderFooter}
      isModal
      navigationTitle="How much do you want to deposit?"
      shouldAvoidKeyboard
      contentContainerStyle={{ padding: 16, gap: 24 }}>
      <View sx={{ gap: 8, paddingTop: 8 }}>
        <Text variant="heading2">How much do you want to deposit?</Text>
        <Text variant="subtitle1" sx={{ color: '$textSecondary' }}>
          Add funds to your balance to use to trade
        </Text>
      </View>

      <View sx={{ gap: 12, alignItems: 'center' }}>
        <FiatAmountInputWidget
          sx={{ width: '100%' }}
          autoFocus
          currency="USDC"
          amount={amount}
          isAmountValid={!isBelowMin}
          onChange={setAmount}
          formatInCurrency={formatUsdcAmount}
          formatIntegerCurrency={formatUsdInteger}
          formatInSubTextNumber={formatInSubTextNumber}
          presets={DEPOSIT_PRESETS}
          subTextPosition="bottom"
          trailingCurrencyMaxFontSize={24}
          returnKeyType="none"
        />

        {isBelowMin ? (
          <Text variant="caption" sx={{ color: '$textDanger' }}>
            {`Minimum deposit is ${MIN_DEPOSIT_USDC} USDC`}
          </Text>
        ) : (
          <Text variant="caption" sx={{ color: '$textPrimary' }}>
            {`Balance: ${formatWalletUsdc(WALLET_USDC_BALANCE)}`}
          </Text>
        )}
      </View>
    </ScrollScreen>
  )
}
