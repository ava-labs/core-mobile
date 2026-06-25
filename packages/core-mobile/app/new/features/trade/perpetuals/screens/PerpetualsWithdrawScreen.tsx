import { TokenUnit } from '@avalabs/core-utils-sdk'
import {
  Button,
  GroupList,
  type GroupListItem,
  Text,
  TokenUnitInputWidget,
  View
} from '@avalabs/k2-alpine'
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

// Stubs until we wire the real Hyperliquid clearinghouse-derived values.
const AVAILABLE_USDC = 1234.45
const PENDING_SETTLEMENTS_USDC = 439.54
const PENDING_POSITION_COUNT = 3
const FEE_USDC = 0.5

const formatUsdcAmount = (amount: number): string =>
  `${formatNumber(amount)} USDC`
const formatUsd = (amount: number): string => `$${formatNumber(amount)} USD`

export const PerpetualsWithdrawScreen = (): JSX.Element => {
  const router = useRouter()
  const [amount, setAmount] = useState<number>(0)

  const availableBalance = useMemo(() => toUsdc(AVAILABLE_USDC), [])

  const handleAmountChange = useCallback((value: TokenUnit): void => {
    setAmount(value.toDisplay({ asNumber: true }))
  }, [])

  const formatInCurrency = useCallback(
    (value: TokenUnit): string =>
      formatUsd(value.toDisplay({ asNumber: true })),
    []
  )

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
            {`Maximum withdrawal is ${formatUsdcAmount(AVAILABLE_USDC)}`}
          </Text>
        ) : null}
      </View>

      <GroupList data={availableRow} />
      <GroupList data={breakdown} />
    </ScrollScreen>
  )
}
