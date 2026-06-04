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
import { useTriggerToggles } from '../hooks/useTriggerToggles'
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
    liquidationPrice
  } = usePlaceOrder()

  const isLong = side === 'long'
  const directionLabel = isLong ? 'Long' : 'Short'
  const subtitle = `You're predicting the price of ${coin} will go ${
    isLong ? 'up' : 'down'
  }`

  const handleAddLeverage = useCallback(() => {
    router.navigate('/perpetualsPlaceOrder/leverage')
  }, [router])

  const handleOpenTakeProfit = useCallback(() => {
    router.navigate('/perpetualsPlaceOrder/trigger?kind=takeProfit')
  }, [router])

  const handleOpenStopLoss = useCallback(() => {
    router.navigate('/perpetualsPlaceOrder/trigger?kind=stopLoss')
  }, [router])

  const { takeProfit, stopLoss } = useTriggerToggles({
    openTakeProfit: handleOpenTakeProfit,
    openStopLoss: handleOpenStopLoss
  })

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
        testID="perpetuals_place_order_confirm"
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
                testID="perpetuals_place_order_amount"
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
            enabled={takeProfit.enabled}
            onToggle={takeProfit.onToggle}
            drillLabel="Price target"
            drillValue={takeProfit.drillValue}
            onPressDrill={handleOpenTakeProfit}
            testID="perpetuals_place_order_take_profit"
          />

          <TriggerToggleCard
            title="Add stop loss"
            subtitle="Price level at which your position automatically closes to cap your losses"
            enabled={stopLoss.enabled}
            onToggle={stopLoss.onToggle}
            drillLabel="Stop price"
            drillValue={stopLoss.drillValue}
            onPressDrill={handleOpenStopLoss}
            testID="perpetuals_place_order_stop_loss"
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
