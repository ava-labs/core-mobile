import { TokenUnit } from '@avalabs/core-utils-sdk'
import { Button, Text, TokenUnitInputWidget } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { showSnackbar } from 'common/utils/toast'
import { useRouter } from 'expo-router'
import React, { useCallback, useMemo, useState } from 'react'
import { formatNumber } from 'utils/formatNumber/formatNumber'
import { MIN_DEPOSIT_USDC, USDC_DECIMALS } from '../consts'
import { useCChainUsdc } from '../hooks/useCChainUsdc'
import { usePerpsDeposit } from '../hooks/usePerpsDeposit'

const USDC_TOKEN = { maxDecimals: USDC_DECIMALS, symbol: 'USDC' }

const toUsdc = (amount: number): TokenUnit =>
  new TokenUnit(
    Math.round(amount * 10 ** USDC_DECIMALS),
    USDC_DECIMALS,
    USDC_TOKEN.symbol
  )

const formatWalletUsdc = (amount: number): string =>
  `${formatNumber(amount)} USDC`

const formatUsd = (amount: number): string => `$${formatNumber(amount)} USD`

export const PerpetualsDepositScreen = (): JSX.Element => {
  const router = useRouter()
  const [amount, setAmount] = useState(0)

  const { formattedBalance } = useCChainUsdc()
  const walletUsdc = useMemo(
    () => Number(formattedBalance.toString()),
    [formattedBalance]
  )
  const walletBalance = useMemo(() => toUsdc(walletUsdc), [walletUsdc])

  const { bestQuote, isQuoting, canDeposit, isDepositing, executeDeposit } =
    usePerpsDeposit(amount > 0 ? String(amount) : '')

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
  const exceedsBalance = hasInput && amount > walletUsdc
  const isValid = amount >= MIN_DEPOSIT_USDC && !exceedsBalance

  const handleSubmit = useCallback(async () => {
    if (!isValid || bestQuote === undefined) {
      return
    }
    try {
      await executeDeposit(bestQuote)
      showSnackbar('Deposit submitted')
      router.back()
    } catch {
      showSnackbar('Deposit failed. Please try again.')
    }
  }, [isValid, bestQuote, executeDeposit, router])

  const footerLabel = isDepositing
    ? 'Depositing...'
    : isQuoting
    ? 'Getting quote...'
    : 'Deposit funds'

  const renderFooter = useCallback(
    () => (
      <Button
        type="primary"
        size="large"
        disabled={!isValid || !canDeposit || isDepositing}
        onPress={handleSubmit}>
        {footerLabel}
      </Button>
    ),
    [isValid, canDeposit, isDepositing, footerLabel, handleSubmit]
  )

  const helperText = isBelowMin
    ? `Minimum deposit is ${MIN_DEPOSIT_USDC} USDC`
    : exceedsBalance
    ? 'Insufficient USDC balance'
    : `Balance: ${formatWalletUsdc(walletUsdc)}`

  return (
    <ScrollScreen
      renderFooter={renderFooter}
      isModal
      title="How much do you want to deposit?"
      subtitle="Add funds to your balance to use to trade"
      navigationTitle="How much do you want to deposit?"
      shouldAvoidKeyboard
      contentContainerStyle={{ padding: 16, gap: 12, alignItems: 'center' }}>
      <TokenUnitInputWidget
        sx={{ width: '100%' }}
        autoFocus
        token={USDC_TOKEN}
        balance={walletBalance}
        amount={amount > 0 ? toUsdc(amount) : undefined}
        onChange={handleAmountChange}
        formatInCurrency={formatInCurrency}
        valid={!isBelowMin && !exceedsBalance}
      />

      <Text
        variant="caption"
        sx={{
          color: isBelowMin || exceedsBalance ? '$textDanger' : '$textPrimary'
        }}>
        {helperText}
      </Text>
    </ScrollScreen>
  )
}
