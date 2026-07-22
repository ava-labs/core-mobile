import { Button, FiatAmountInput, Text, useTheme, View } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { dismissKeyboardIfNeeded } from 'common/utils/dismissKeyboardIfNeeded'
import { useRouter } from 'expo-router'
import React, { useCallback, useMemo, useState } from 'react'
import { formatNumber } from 'utils/formatNumber/formatNumber'
import { PositionPill } from '../components/PositionPill'
import { usePlaceOrder } from '../contexts/PlaceOrderContext'
import { useHyperliquidMarketContext } from '../hooks/useHyperliquidMarketContext'
import { pctFromEntry, pctParts, pnlColor } from '../utils/economics'
import { toNumber } from '../utils/format'

/**
 * Limit-price editor for the place-order flow. Unlike TP/SL triggers there is
 * no directional constraint — any positive price is a legal limit order (a
 * marketable one simply fills immediately), so validation is `price > 0` only.
 */
export const PerpetualsLimitPriceScreen = (): JSX.Element => {
  const { theme } = useTheme()
  const router = useRouter()

  const { coin, side, entryPrice, limitPrice, setLimitPrice, setLimitPriceEnabled } =
    usePlaceOrder()

  const [priceText, setPriceText] = useState(
    limitPrice !== undefined ? String(limitPrice) : ''
  )

  const price = useMemo(() => {
    if (priceText.length === 0) return undefined
    const parsed = Number(priceText)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
  }, [priceText])

  // Relation to the live mark price (falls back to the seeded entry until the
  // market feed loads) — informational only, never a validation error.
  const { assetCtx } = useHyperliquidMarketContext(coin)
  const liveMarkPrice = toNumber(assetCtx?.markPx)
  const currentPrice = liveMarkPrice > 0 ? liveMarkPrice : entryPrice
  const pct = price !== undefined ? pctFromEntry(price, currentPrice) : undefined
  const pctColor = pnlColor(pct, theme.colors, theme.colors.$textSecondary)

  const formatInCurrency = useCallback(
    (n: number): string => `$${formatNumber(n)}`,
    []
  )

  const formatInSubTextNumber = useCallback(
    (): JSX.Element => (
      <Text variant="subtitle2" sx={{ color: '$textPrimary' }}>
        <Text
          variant="subtitle2"
          sx={{ color: pctColor, fontFamily: 'Inter-SemiBold' }}>
          {pctParts(pct, 'Set a limit price').percent}
        </Text>
        {pctParts(pct, 'Set a limit price').suffix}
      </Text>
    ),
    [pct, pctColor]
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
            formatInSubTextNumber={formatInSubTextNumber}
            subTextPosition="bottom"
            returnKeyType="none"
          />
        </View>
      </View>
    </ScrollScreen>
  )
}
