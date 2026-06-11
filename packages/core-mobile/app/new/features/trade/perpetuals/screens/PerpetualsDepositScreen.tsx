import { TokenUnit } from '@avalabs/core-utils-sdk'
import { Button, Text, TokenUnitInputWidget, View } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useRouter } from 'expo-router'
import React, { useCallback, useMemo, useState } from 'react'
import { formatNumber } from 'utils/formatNumber/formatNumber'

const USDC_DECIMALS = 6
const USDC_TOKEN = { maxDecimals: USDC_DECIMALS, symbol: 'USDC' }

const toUsdc = (amount: number): TokenUnit =>
  new TokenUnit(
    Math.round(amount * 10 ** USDC_DECIMALS),
    USDC_DECIMALS,
    USDC_TOKEN.symbol
  )

const MIN_DEPOSIT_USDC = 10
// Stub until we wire the real USDC wallet balance (C-Chain ERC-20).
const WALLET_USDC_BALANCE = 28.1142

const DEPOSIT_PRESETS = [
  { label: '$100', value: 100 },
  { label: '$250', value: 250 },
  { label: '$500', value: 500 }
] as const

const formatWalletUsdc = (amount: number): string =>
  `${formatNumber(amount)} USDC`

const formatUsd = (amount: number): string => `$${formatNumber(amount)} USD`

export const PerpetualsDepositScreen = (): JSX.Element => {
  const router = useRouter()
  const [amount, setAmount] = useState(0)

  const walletBalance = useMemo(() => toUsdc(WALLET_USDC_BALANCE), [])

  const handleAmountChange = useCallback((value: TokenUnit): void => {
    setAmount(value.toDisplay({ asNumber: true }))
  }, [])

  const formatInCurrency = useCallback(
    (value: TokenUnit): string =>
      formatUsd(value.toDisplay({ asNumber: true })),
    []
  )

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
        <TokenUnitInputWidget
          sx={{ width: '100%' }}
          autoFocus
          token={USDC_TOKEN}
          balance={walletBalance}
          amount={amount > 0 ? toUsdc(amount) : undefined}
          onChange={handleAmountChange}
          formatInCurrency={formatInCurrency}
          presets={DEPOSIT_PRESETS}
          valid={!isBelowMin}
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
