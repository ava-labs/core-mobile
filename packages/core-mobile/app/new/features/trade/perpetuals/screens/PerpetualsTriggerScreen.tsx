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
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useCallback, useMemo, useState } from 'react'
import { formatNumber } from 'utils/formatNumber/formatNumber'
import { PositionPill } from '../components/PositionPill'
import { usePlaceOrder } from '../contexts/PlaceOrderContext'
import {
  formatSigned,
  isTriggerValid,
  pctFromEntry,
  pnlColor,
  positionSizeTokens,
  projectedPnl,
  requiredTriggerSide,
  type TriggerKind
} from '../utils/economics'

// The percentage is colored by sign; the " above/below current price" suffix
// stays in the secondary text color (per design).
const pctParts = (
  pct: number | undefined
): { percent: string; suffix: string } => {
  if (pct === undefined) return { percent: '', suffix: 'Set a price target' }
  const sign = pct >= 0 ? '+' : ''
  const direction = pct >= 0 ? 'above' : 'below'
  return {
    percent: `${sign}${pct.toFixed(2)}%`,
    suffix: ` ${direction} current price`
  }
}

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
    leverage,
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

  const pct = price !== undefined ? pctFromEntry(price, entryPrice) : undefined

  const sizeTokens = positionSizeTokens(amount, leverage, entryPrice)
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

  const valid = isTriggerValid({ kind, isLong, price, entryPrice })
  // Show the directional error once a price is entered on the wrong side.
  const showError = price !== undefined && !valid
  const errorMessage = `${copy.label} must be ${requiredTriggerSide(
    kind,
    isLong
  )} entry price`

  const handleDone = useCallback(() => {
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
