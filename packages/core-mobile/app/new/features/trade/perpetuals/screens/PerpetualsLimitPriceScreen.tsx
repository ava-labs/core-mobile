import { Button, FiatAmountInput, View } from '@avalabs/k2-alpine'
import { roundToHyperliquidPrice } from '@avalabs/perps-sdk'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { dismissKeyboardIfNeeded } from 'common/utils/dismissKeyboardIfNeeded'
import { useRouter } from 'expo-router'
import React, { useCallback, useMemo, useState } from 'react'
import { formatNumber } from 'utils/formatNumber/formatNumber'
import { PositionPill } from '../components/PositionPill'
import { usePlaceOrder } from '../contexts/PlaceOrderContext'
import { useHyperliquidMarketContext } from '../hooks/useHyperliquidMarketContext'
import { useLiveMid } from '../hooks/usePerpsLiveMids'
import { toNumber } from '../utils/format'

/**
 * Limit-price editor for the place-order flow. Unlike TP/SL triggers there is
 * no directional constraint — any positive price is a legal limit order (a
 * marketable one simply fills immediately), so validation is `price > 0` only.
 */
export const PerpetualsLimitPriceScreen = (): JSX.Element => {
  const router = useRouter()

  const {
    coin,
    side,
    entryPrice,
    limitPrice,
    setLimitPrice,
    setLimitPriceEnabled
  } = usePlaceOrder()

  const [priceText, setPriceText] = useState(
    limitPrice !== undefined ? String(limitPrice) : ''
  )

  const price = useMemo(() => {
    if (priceText.length === 0) return undefined
    const parsed = Number(priceText)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
  }, [priceText])

  // Live mark (falls back to the seeded entry until the market feed loads) —
  // only used as the preset anchor's fallback below.
  const { assetCtx, universe } = useHyperliquidMarketContext(coin)
  const liveMarkPrice = toNumber(assetCtx?.markPx)
  const currentPrice = liveMarkPrice > 0 ? liveMarkPrice : entryPrice

  // Quick presets (web parity): offsets anchor to the live mid (mark / seeded
  // entry as fallbacks until the feeds tick) and are side-aware — a long
  // rests below the market, a short above; "Mid" is the mid itself. Values
  // are snapped to Hyperliquid's price grid so a preset is always a valid px.
  const liveMid = useLiveMid(coin)
  const szDecimals = universe?.szDecimals
  const referencePrice = liveMid ?? currentPrice
  const isLong = side === 'long'

  const presets = useMemo(() => {
    const sign = isLong ? -1 : 1
    const prefix = isLong ? '-' : '+'
    return [
      { label: `${prefix}1%`, offset: sign * 0.01 },
      { label: `${prefix}5%`, offset: sign * 0.05 },
      { label: `${prefix}10%`, offset: sign * 0.1 },
      { label: 'Mid', offset: 0 }
    ]
  }, [isLong])

  const handlePreset = useCallback(
    (offset: number): void => {
      if (referencePrice <= 0) {
        return
      }
      const raw = referencePrice * (1 + offset)
      const snapped =
        szDecimals !== undefined
          ? roundToHyperliquidPrice(raw, szDecimals)
          : raw
      setPriceText(String(snapped))
    },
    [referencePrice, szDecimals]
  )

  const formatInCurrency = useCallback(
    (n: number): string => `$${formatNumber(n)}`,
    []
  )

  const handleDone = useCallback(async () => {
    await dismissKeyboardIfNeeded()
    setLimitPrice(price)
    setLimitPriceEnabled(true)
    router.back()
  }, [price, setLimitPrice, setLimitPriceEnabled, router])

  const renderFooter = useCallback(
    () => (
      <Button
        type="primary"
        size="large"
        disabled={price === undefined}
        testID="perpetuals_limit_price_done"
        onPress={handleDone}>
        Done
      </Button>
    ),
    [price, handleDone]
  )

  return (
    <ScrollScreen
      isModal
      title="Set limit price"
      subtitle="Your order will only execute at your limit price or better"
      navigationTitle="Set limit price"
      shouldAvoidKeyboard
      renderFooter={renderFooter}
      contentContainerStyle={{ padding: 16 }}>
      <View sx={{ paddingTop: 8, gap: 4 }}>
        <PositionPill coin={coin} price={entryPrice} side={side} />
        <View
          sx={{
            backgroundColor: '$surfaceSecondary',
            borderRadius: 12,
            paddingVertical: 32,
            paddingHorizontal: 16,
            alignItems: 'center',
            justifyContent: 'center',
            borderTopLeftRadius: 4,
            borderTopRightRadius: 4
          }}>
          <FiatAmountInput
            autoFocus
            currency="USD"
            amount={priceText}
            isAmountValid
            onChange={setPriceText}
            formatInCurrency={formatInCurrency}
            returnKeyType="none"
          />
          <View
            sx={{
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
              marginTop: 16
            }}>
            {presets.map(preset => (
              <Button
                key={preset.label}
                type="secondary"
                size="small"
                onPress={() => handlePreset(preset.offset)}
                testID={`perpetuals_limit_price_preset__${preset.label}`}>
                {preset.label}
              </Button>
            ))}
          </View>
        </View>
      </View>
    </ScrollScreen>
  )
}
