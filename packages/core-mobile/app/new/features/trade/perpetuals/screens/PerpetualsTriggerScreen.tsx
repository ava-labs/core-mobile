import {
  AutoSizeTextInput,
  Button,
  GroupList,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useCallback, useMemo, useState } from 'react'
import { PositionPill } from '../components/PositionPill'
import { usePlaceOrder } from '../contexts/PlaceOrderContext'

type TriggerKind = 'takeProfit' | 'stopLoss'

type ThemeColors = ReturnType<typeof useTheme>['theme']['colors']

const signColor = (
  value: number | undefined,
  colors: ThemeColors,
  neutral: string
): string => {
  if (value === undefined || value === 0) return neutral
  return value > 0 ? colors.$textSuccess : colors.$textDanger
}

const pctCaption = (pct: number | undefined): string => {
  if (pct === undefined) return 'Set a price target'
  const sign = pct >= 0 ? '+' : ''
  const direction = pct >= 0 ? 'above' : 'below'
  return `${sign}${pct.toFixed(2)}% ${direction} current price`
}

const COPY: Record<
  TriggerKind,
  {
    title: string
    subtitle: string
    /** A take-profit always projects a gain, a stop-loss always a loss. */
    pnlLabel: string
  }
> = {
  takeProfit: {
    title: 'Add take profit',
    subtitle:
      'Price level at which your position automatically closes to lock in profits',
    pnlLabel: 'Projected profit'
  },
  stopLoss: {
    title: 'Add stop loss',
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
    stopLossPrice,
    setStopLossPrice
  } = usePlaceOrder()

  const existing = kind === 'takeProfit' ? takeProfitPrice : stopLossPrice
  const [priceText, setPriceText] = useState(
    existing !== undefined ? String(existing) : ''
  )

  const handleChangeText = useCallback((text: string) => {
    setPriceText(text.replace(/[^0-9.]/g, ''))
  }, [])

  const price = useMemo(() => {
    if (priceText.length === 0) return undefined
    const parsed = Number(priceText)
    return Number.isFinite(parsed) ? parsed : undefined
  }, [priceText])

  const pct =
    price !== undefined && entryPrice > 0
      ? ((price - entryPrice) / entryPrice) * 100
      : undefined

  // Position size (in tokens) implied by the collateral + leverage.
  const positionSizeTokens =
    entryPrice > 0 ? (amount * leverage) / entryPrice : 0
  // Needs both a trigger price and a sized position to mean anything.
  const projectedPnl =
    price !== undefined && positionSizeTokens > 0
      ? (price - entryPrice) * positionSizeTokens * (side === 'long' ? 1 : -1)
      : undefined

  const pctColor = signColor(pct, theme.colors, theme.colors.$textSecondary)
  const pnlColor = signColor(
    projectedPnl,
    theme.colors,
    theme.colors.$textPrimary
  )

  const handleDone = useCallback(() => {
    if (kind === 'takeProfit') {
      setTakeProfitPrice(price)
    } else {
      setStopLossPrice(price)
    }
    router.back()
  }, [kind, price, setTakeProfitPrice, setStopLossPrice, router])

  const renderFooter = useCallback(
    () => (
      <Button type="primary" size="large" onPress={handleDone}>
        Done
      </Button>
    ),
    [handleDone]
  )

  const formattedPnl =
    projectedPnl === undefined
      ? '—'
      : `${projectedPnl >= 0 ? '' : '-'}${formatCurrency({
          amount: Math.abs(projectedPnl)
        })}`

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
              borderTopRightRadius: 4,
              gap: 6
            }}>
            <View>
              <AutoSizeTextInput
                prefix="$"
                value={priceText}
                onChangeText={handleChangeText}
                keyboardType="decimal-pad"
                placeholder="0"
                autoFocus
              />
            </View>
            <Text variant="body2" sx={{ color: pctColor }}>
              {pctCaption(pct)}
            </Text>
          </View>
        </View>

        <GroupList
          titleSx={{ fontFamily: 'Inter-Regular' }}
          data={[
            {
              title: copy.pnlLabel,
              value: (
                <Text
                  sx={{
                    color: pnlColor,
                    fontSize: 16,
                    fontFamily: 'Inter-Medium'
                  }}>
                  {formattedPnl}
                </Text>
              )
            }
          ]}
        />
      </View>
    </ScrollScreen>
  )
}
