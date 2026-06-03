import { Button, LeverageGauge, Text, View } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { useRouter } from 'expo-router'
import React, { useCallback, useState } from 'react'
import { usePlaceOrder } from '../contexts/PlaceOrderContext'

export const PerpetualsLeverageScreen = (): JSX.Element => {
  const router = useRouter()
  const { formatCurrency } = useFormatCurrency()

  const { side, entryPrice, maxLeverage, leverage, setLeverage } =
    usePlaceOrder()

  // Local draft so gauge edits don't mutate the order until confirmed.
  const [draftLeverage, setDraftLeverage] = useState(leverage)

  const handleConfirm = useCallback(() => {
    setLeverage(draftLeverage)
    router.back()
  }, [draftLeverage, setLeverage, router])

  // Isolated-margin liquidation estimate at the drafted leverage.
  const liquidationPrice =
    draftLeverage > 0
      ? side === 'long'
        ? entryPrice - entryPrice / draftLeverage
        : entryPrice + entryPrice / draftLeverage
      : entryPrice

  const liquidationPct =
    entryPrice > 0 ? ((liquidationPrice - entryPrice) / entryPrice) * 100 : 0
  const direction = liquidationPct >= 0 ? 'above' : 'below'
  const liquidationCaption = `Liquidated at ${formatCurrency({
    amount: liquidationPrice
  })} (${liquidationPct >= 0 ? '+' : ''}${liquidationPct.toFixed(
    2
  )}% ${direction} current price)`

  const renderFooter = useCallback(
    () => (
      <Button type="primary" size="large" onPress={handleConfirm}>
        Done
      </Button>
    ),
    [handleConfirm]
  )

  return (
    <ScrollScreen
      isModal
      title="Add leverage"
      subtitle="Leverage increases your risk amplifying both gains and losses"
      navigationTitle="Add leverage"
      renderFooter={renderFooter}
      contentContainerStyle={{ padding: 16 }}>
      <View sx={{ paddingTop: 8, gap: 4 }}>
        <LeverageGauge
          value={draftLeverage}
          onChange={setDraftLeverage}
          min={1}
          max={maxLeverage}
          integersOnly
          subtitle={`Up to ${maxLeverage}× leverage`}
        />

        <Text
          variant="caption"
          sx={{ color: '$textSecondary', textAlign: 'center' }}>
          {liquidationCaption}
        </Text>
      </View>
    </ScrollScreen>
  )
}
