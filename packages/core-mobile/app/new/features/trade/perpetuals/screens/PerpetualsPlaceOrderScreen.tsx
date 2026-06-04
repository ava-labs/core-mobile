import {
  alpha,
  CircularDial,
  GroupList,
  SlidingButton,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { useRouter } from 'expo-router'
import React, { useCallback, useState } from 'react'
import { PositionPill } from '../components/PositionPill'
import { TriggerToggleCard } from '../components/TriggerToggleCard'
import { usePlaceOrder } from '../contexts/PlaceOrderContext'
import HyperliquidLogo from '../../../../assets/icons/hyperliquid-logo.svg'

export const PerpetualsPlaceOrderScreen = (): JSX.Element => {
  const router = useRouter()
  const { theme } = useTheme()
  const { formatCurrency } = useFormatCurrency()
  const [submitting, setSubmitting] = useState(false)

  const {
    coin,
    side,
    entryPrice,
    availableBalance,
    amount,
    setAmount,
    leverage,
    liquidationPrice,
    takeProfitEnabled,
    setTakeProfitEnabled,
    takeProfitPrice,
    setTakeProfitPrice,
    stopLossEnabled,
    setStopLossEnabled,
    stopLossPrice,
    setStopLossPrice
  } = usePlaceOrder()

  const isLong = side === 'long'
  const directionLabel = isLong ? 'Long' : 'Short'
  const subtitle = `You're predicting the price of ${coin} will go ${
    isLong ? 'up' : 'down'
  }`

  const handleAddLeverage = useCallback(() => {
    router.navigate('/perpetualsPlaceOrder/leverage')
  }, [router])

  const handleToggleTakeProfit = useCallback(
    (next: boolean) => {
      setTakeProfitEnabled(next)
      if (!next) setTakeProfitPrice(undefined)
    },
    [setTakeProfitEnabled, setTakeProfitPrice]
  )

  const handleToggleStopLoss = useCallback(
    (next: boolean) => {
      setStopLossEnabled(next)
      if (!next) setStopLossPrice(undefined)
    },
    [setStopLossEnabled, setStopLossPrice]
  )

  const handleOpenTakeProfit = useCallback(() => {
    router.navigate('/perpetualsPlaceOrder/trigger?kind=takeProfit')
  }, [router])

  const handleOpenStopLoss = useCallback(() => {
    router.navigate('/perpetualsPlaceOrder/trigger?kind=stopLoss')
  }, [router])

  const handleConfirm = useCallback(async () => {
    // UI-only: simulate the order submission. SDK wiring (marketOrder /
    // placeOrderWithTpSl + agent signer) lands in a follow-up.
    setSubmitting(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1200))
      router.back()
    } finally {
      setSubmitting(false)
    }
  }, [router])

  const renderFooter = useCallback(
    () => (
      <SlidingButton
        mode="single"
        label={`Slide to buy ${directionLabel}`}
        loading={submitting}
        disabled={amount <= 0}
        onConfirm={handleConfirm}
      />
    ),
    [directionLabel, submitting, amount, handleConfirm]
  )

  const leverageBadge = (
    <View
      sx={{
        backgroundColor: '$borderPrimary',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 4
      }}>
      <Text variant="buttonSmall" sx={{ color: '$textPrimary' }}>
        {`${leverage}×`}
      </Text>
    </View>
  )

  return (
    <ScrollScreen
      isModal
      title="Place your bet"
      subtitle={subtitle}
      navigationTitle="Place your bet"
      renderFooter={renderFooter}
      contentContainerStyle={{ padding: 16 }}>
      <View sx={{ paddingTop: 8, gap: 20, paddingBottom: 8 }}>
        <View sx={{ gap: 8 }}>
          <PositionPill coin={coin} price={entryPrice} side={side} />

          <View sx={{ gap: 4 }}>
            <View
              sx={{
                backgroundColor: '$surfaceSecondary',
                borderRadius: 12,
                paddingVertical: 16
              }}>
              <CircularDial
                value={amount}
                onChange={setAmount}
                max={availableBalance}
                label="USD"
                enableManualInput
              />
            </View>
            <Text
              variant="caption"
              sx={{ color: '$textSecondary', textAlign: 'center' }}>
              {`Available balance: ${formatCurrency({
                amount: availableBalance
              })}`}
            </Text>
          </View>
        </View>

        <View sx={{ gap: 20 }}>
          <GroupList
            titleSx={{ fontFamily: 'Inter-Regular' }}
            subtitleVariant="caption"
            data={[
              {
                title: 'Add leverage',
                subtitle: `Liquidated at ${formatCurrency({
                  amount: liquidationPrice
                })}`,
                onPress: handleAddLeverage,
                value: leverageBadge
              }
            ]}
          />

          <TriggerToggleCard
            title="Add take profit"
            subtitle="Price target at which your position will automatically close and lock in your gains"
            enabled={takeProfitEnabled}
            onToggle={handleToggleTakeProfit}
            drillLabel="Price target"
            drillValue={
              takeProfitPrice !== undefined
                ? formatCurrency({ amount: takeProfitPrice })
                : undefined
            }
            onPressDrill={handleOpenTakeProfit}
          />

          <TriggerToggleCard
            title="Add stop loss"
            subtitle="Price level at which your position automatically closes to cap your losses"
            enabled={stopLossEnabled}
            onToggle={handleToggleStopLoss}
            drillLabel="Stop price"
            drillValue={
              stopLossPrice !== undefined
                ? formatCurrency({ amount: stopLossPrice })
                : undefined
            }
            onPressDrill={handleOpenStopLoss}
          />
        </View>
        <View
          sx={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6
          }}>
          <Text
            variant="caption"
            sx={{
              color: '$textSecondary'
            }}>
            Powered by
          </Text>
          <HyperliquidLogo color={alpha(theme.colors.$textPrimary, 0.6)} />
        </View>
      </View>
    </ScrollScreen>
  )
}
