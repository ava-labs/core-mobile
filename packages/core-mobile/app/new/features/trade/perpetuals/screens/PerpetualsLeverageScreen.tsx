import { Button, LeverageGauge, Text, View } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { useRouter } from 'expo-router'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { usePlaceOrder } from '../contexts/PlaceOrderContext'
import { usePerpsActiveAssetData } from '../hooks/usePerpsActiveAssetData'
import { usePerpsPositionActions } from '../hooks/usePerpsPositionActions'
import { estimateLiquidationPrice, pctFromEntry } from '../utils/economics'

export const PerpetualsLeverageScreen = (): JSX.Element => {
  const router = useRouter()
  const { formatCurrency } = useFormatCurrency()

  const { coin, side, entryPrice, maxLeverage, leverage, setLeverage } =
    usePlaceOrder()
  const { updateLeverage, busy } = usePerpsPositionActions()
  const { leverage: hlLeverage, refetch: refetchLeverage } =
    usePerpsActiveAssetData(coin)

  // Local draft so gauge edits don't mutate the order until confirmed.
  const [draftLeverage, setDraftLeverage] = useState(leverage)

  // Seed the gauge from Hyperliquid's actual per-coin leverage once it loads,
  // but only before the user has touched the gauge (so we never fight edits).
  const userTouchedRef = useRef(false)
  useEffect(() => {
    if (userTouchedRef.current || hlLeverage === undefined) {
      return
    }
    const clamped = Math.min(Math.max(1, hlLeverage), Math.max(1, maxLeverage))
    setDraftLeverage(clamped)
    // Keep the order context in sync so the place-order screen shows HL's value.
    setLeverage(clamped)
  }, [hlLeverage, maxLeverage, setLeverage])

  const handleGaugeChange = useCallback((value: number) => {
    userTouchedRef.current = true
    setDraftLeverage(value)
  }, [])

  // Keep Done disabled until the user actually changes the leverage value,
  // so it can't be tapped before a new value is ready to commit.
  const isUnchanged = draftLeverage === leverage

  // Commit leverage to Hyperliquid here (not at order submit) so the order
  // itself never triggers a "decrease leverage" margin rejection. After it
  // succeeds, read the leverage back from HL so local state reflects the
  // actual on-chain value rather than assuming the draft was applied.
  const handleConfirm = useCallback(async () => {
    const ok = await updateLeverage(coin, draftLeverage, true)
    if (!ok) {
      return
    }
    const applied = await refetchLeverage()
    setLeverage(applied ?? draftLeverage)
    router.back()
  }, [
    coin,
    draftLeverage,
    updateLeverage,
    refetchLeverage,
    setLeverage,
    router
  ])

  const liquidationPrice = estimateLiquidationPrice(
    entryPrice,
    draftLeverage,
    side === 'long',
    maxLeverage
  )
  const liquidationPct = pctFromEntry(liquidationPrice, entryPrice)
  const direction = liquidationPct >= 0 ? 'above' : 'below'
  const liquidationCaption = `Est. liquidation at ${formatCurrency({
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
        disabled={isUnchanged || busy}
        onPress={handleConfirm}>
        Done
      </Button>
    ),
    [handleConfirm, isUnchanged, busy]
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
          onChange={handleGaugeChange}
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
