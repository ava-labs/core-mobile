import {
  Button,
  FiatAmountInput,
  GroupList,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { dismissKeyboardIfNeeded } from 'common/utils/dismissKeyboardIfNeeded'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useCallback, useMemo, useState } from 'react'
import { formatNumber } from 'utils/formatNumber/formatNumber'
import { PositionPill } from '../components/PositionPill'
import { usePlaceOrder } from '../contexts/PlaceOrderContext'
import { useHyperliquidMarketContext } from '../hooks/useHyperliquidMarketContext'
import {
  formatSigned,
  isTriggerValid,
  pctFromEntry,
  pctParts,
  pnlColor,
  positionSizeTokens,
  projectedPnl,
  requiredTriggerSide,
  type TriggerKind
} from '../utils/economics'
import { toNumber } from '../utils/format'

const COPY: Record<
  TriggerKind,
  {
    title: string
    /** Short label used in the validation error, e.g. "Take profit". */
    label: string
    subtitle: string
    /** A take-profit always projects a gain, a stop-loss always a loss. */
    pnlLabel: string
  }
> = {
  takeProfit: {
    title: 'Add take profit',
    label: 'Take profit',
    subtitle:
      'Price level at which your position automatically closes to lock in profits',
    pnlLabel: 'Projected profit'
  },
  stopLoss: {
    title: 'Add stop loss',
    label: 'Stop loss',
    subtitle:
      'Price level at which your position automatically closes to cap your losses',
    pnlLabel: 'Projected loss'
  }
}

export const PerpetualsTriggerScreen = (): JSX.Element => {
  const { theme } = useTheme()
  const router = useRouter()
  const { formatCurrency } = useFormatCurrency()

  const { kind: kindParam } = useLocalSearchParams<{ kind?: string }>()
  const kind: TriggerKind = kindParam === 'stopLoss' ? 'stopLoss' : 'takeProfit'
  const copy = COPY[kind]

  const {
    coin,
    side,
    entryPrice,
    amount,
    takeProfitPrice,
    setTakeProfitPrice,
    setTakeProfitEnabled,
    stopLossPrice,
    setStopLossPrice,
    setStopLossEnabled
  } = usePlaceOrder()
  const isLong = side === 'long'

  const existing = kind === 'takeProfit' ? takeProfitPrice : stopLossPrice
  const [priceText, setPriceText] = useState(
    existing !== undefined ? String(existing) : ''
  )

  const handleChangeText = useCallback((text: string) => {
    setPriceText(text)
  }, [])

  const price = useMemo(() => {
    if (priceText.length === 0) return undefined
    const parsed = Number(priceText)
    return Number.isFinite(parsed) ? parsed : undefined
  }, [priceText])

  // Validate the trigger and show its % against the *live* mark price, not the
  // position's entry. In the manage flow `entryPrice` is the historical fill, so
  // a TP/SL already on the wrong side of the current price would fire (or be
  // rejected) the instant the user submits. The open flow seeds `entryPrice`
  // from live mark, so the fallback keeps it correct there (and until mark loads).
  const { assetCtx } = useHyperliquidMarketContext(coin)
  const liveMarkPrice = toNumber(assetCtx?.markPx)
  const currentPrice = liveMarkPrice > 0 ? liveMarkPrice : entryPrice

  const pct =
    price !== undefined ? pctFromEntry(price, currentPrice) : undefined

  // P&L is always measured from the real entry price, not the current mark.
  const sizeTokens = positionSizeTokens(amount, entryPrice)
  // Needs both a trigger price and a sized position to mean anything.
  const projected =
    price !== undefined && sizeTokens > 0
      ? projectedPnl({ exitPrice: price, entryPrice, sizeTokens, isLong })
      : undefined

  const pctColor = pnlColor(pct, theme.colors, theme.colors.$textSecondary)
  const projectedColor = pnlColor(
    projected,
    theme.colors,
    theme.colors.$textPrimary
  )

  // Drives the leading "$" on the amount (the symbol FiatAmountInput extracts
  // from this string); the value itself is shown by the input, not this.
  const formatInCurrency = useCallback(
    (n: number): string => `$${formatNumber(n)}`,
    []
  )

  // The "+x% above/below current price" line under the amount.
  const formatInSubTextNumber = useCallback(
    (): JSX.Element => (
      <Text variant="subtitle2" sx={{ color: '$textPrimary' }}>
        <Text
          variant="subtitle2"
          sx={{ color: pctColor, fontFamily: 'Inter-SemiBold' }}>
          {pctParts(pct).percent}
        </Text>
        {pctParts(pct).suffix}
      </Text>
    ),
    [pct, pctColor]
  )

  const valid = isTriggerValid({
    kind,
    isLong,
    price,
    referencePrice: currentPrice
  })
  // Show the directional error once a price is entered on the wrong side.
  const showError = price !== undefined && !valid
  const errorMessage = `${copy.label} must be ${requiredTriggerSide(
    kind,
    isLong
  )} current price`

  const handleDone = useCallback(async () => {
    await dismissKeyboardIfNeeded()
    if (kind === 'takeProfit') {
      setTakeProfitPrice(price)
      setTakeProfitEnabled(true)
    } else {
      setStopLossPrice(price)
      setStopLossEnabled(true)
    }
    router.back()
  }, [
    kind,
    price,
    setTakeProfitPrice,
    setTakeProfitEnabled,
    setStopLossPrice,
    setStopLossEnabled,
    router
  ])

  const renderFooter = useCallback(
    () => (
      <Button
        type="primary"
        size="large"
        disabled={!valid}
        testID="perpetuals_trigger_done"
        onPress={handleDone}>
        Done
      </Button>
    ),
    [valid, handleDone]
  )

  const formattedPnl =
    projected === undefined
      ? '-'
      : formatSigned(projected, n => formatCurrency({ amount: n }), {
          alwaysSign: false
        })

  return (
    <ScrollScreen
      isModal
      title={copy.title}
      subtitle={copy.subtitle}
      navigationTitle={copy.title}
      shouldAvoidKeyboard
      renderFooter={renderFooter}
      contentContainerStyle={{ padding: 16 }}>
      <View sx={{ paddingTop: 8, gap: 10 }}>
        <View sx={{ gap: 4 }}>
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
              isAmountValid={!showError}
              onChange={handleChangeText}
              formatInCurrency={formatInCurrency}
              formatInSubTextNumber={formatInSubTextNumber}
              subTextPosition="bottom"
              returnKeyType="none"
            />
          </View>
          {showError ? (
            <Text
              variant="subtitle2"
              sx={{ color: '$textDanger', textAlign: 'center' }}>
              {errorMessage}
            </Text>
          ) : null}
        </View>

        <GroupList
          titleSx={{ fontFamily: 'Inter-Regular' }}
          valueSx={{
            color: projectedColor,
            fontSize: 16,
            fontFamily: 'Inter-Medium'
          }}
          data={[
            {
              title: copy.pnlLabel,
              value: formattedPnl
            }
          ]}
        />
      </View>
    </ScrollScreen>
  )
}
