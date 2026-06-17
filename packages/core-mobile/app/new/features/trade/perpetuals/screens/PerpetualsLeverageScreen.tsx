import { Button, LeverageGauge, Text, View } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { useRouter } from 'expo-router'
import React, { useCallback, useState } from 'react'
import { usePlaceOrder } from '../contexts/PlaceOrderContext'
import { estimateLiquidationPrice, pctFromEntry } from '../utils/economics'

export const PerpetualsLeverageScreen = (): JSX.Element => {
  const router = useRouter()
  const { formatCurrency } = useFormatCurrency()

  const { side, entryPrice, maxLeverage, leverage, setLeverage } =
    usePlaceOrder()

  // Local draft so gauge edits don't mutate the order until confirmed.
  const [draftLeverage, setDraftLeverage] = useState(leverage)

  // Keep Done disabled until the user actually changes the leverage value,
  // so it can't be tapped before a new value is ready to commit.
  const isUnchanged = draftLeverage === leverage

  const handleConfirm = useCallback(() => {
    setLeverage(draftLeverage)
    router.back()
  }, [draftLeverage, setLeverage, router])

  const liquidationPrice = estimateLiquidationPrice(
    entryPrice,
    draftLeverage,
    side === 'long'
  )
  const liquidationPct = pctFromEntry(liquidationPrice, entryPrice)
  const direction = liquidationPct >= 0 ? 'above' : 'below'
  const liquidationCaption = `Liquidated at ${formatCurrency({
    amount: liquidationPrice
  })} (${liquidationPct >= 0 ? '+' : ''}${liquidationPct.toFixed(
    2
  )}% ${direction} current price)`

  const renderFooter = useCallback(
    () => (
      <Button
        type="primary"
        size="large"
        testID="perpetuals_leverage_done"
        disabled={isUnchanged}
        onPress={handleConfirm}>
        Done
      </Button>
    ),
    [handleConfirm, isUnchanged]
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
