import {
  AutoSizeTextInput,
  CircularDial,
  type CircularDialPresetButton,
  GroupList,
  SlidingButton,
  Text,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useCallback, useState } from 'react'
import { PositionPill } from '../components/PositionPill'
import type { OrderSide } from '../contexts/PlaceOrderContext'
import {
  DEFAULT_COIN,
  DEFAULT_ENTRY_PRICE,
  formatSigned,
  MOCK_PNL,
  MOCK_POSITION_VALUE,
  pnlColor,
  projectedPnl,
  sanitizeDecimalInput
} from '../utils/economics'

type CloseKind = 'market' | 'limit'

const MARKET_PRESETS: CircularDialPresetButton[] = [
  { label: '25%', fraction: 0.25 },
  { label: '50%', fraction: 0.5 },
  { label: '100%', fraction: 1 }
]

// Limit price presets, as a % above the current price.
const LIMIT_OFFSETS = [5, 10, 25]

interface CloseParams {
  coin: string
  side: OrderSide
  price: number
  entryPrice: number
  positionValue: number
  totalPnl: number
}

const useCloseParams = (): { kind: CloseKind } & CloseParams => {
  const params = useLocalSearchParams<{
    kind?: string
    coin?: string
    side?: string
    price?: string
    entry?: string
    value?: string
    pnl?: string
  }>()
  // Finite parse so a legitimate `0` (e.g. flat pnl) isn't treated as missing.
  const num = (value: string | undefined): number | undefined => {
    if (value === undefined) return undefined
    const n = Number(value)
    return Number.isFinite(n) ? n : undefined
  }
  const price = num(params.price) ?? DEFAULT_ENTRY_PRICE
  return {
    kind: params.kind === 'limit' ? 'limit' : 'market',
    coin: (params.coin ?? DEFAULT_COIN).toUpperCase(),
    side: params.side === 'short' ? 'short' : 'long',
    price,
    entryPrice: num(params.entry) ?? price,
    positionValue: num(params.value) ?? MOCK_POSITION_VALUE,
    totalPnl: num(params.pnl) ?? MOCK_PNL
  }
}

const DASH = '$-'

const ProfitText = ({ value }: { value: number | undefined }): JSX.Element => {
  const { theme } = useTheme()
  const { formatCurrency } = useFormatCurrency()
  const color = pnlColor(value, theme.colors, theme.colors.$textPrimary)
  const text =
    value === undefined
      ? DASH
      : formatSigned(value, n => formatCurrency({ amount: n }))
  return (
    <Text variant="body1" sx={{ color }}>
      {text}
    </Text>
  )
}

const useCloseSubmit = (): {
  submitting: boolean
  submit: () => Promise<void>
} => {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const submit = useCallback(async () => {
    // UI-only: simulate the close. SDK wiring (reduce-only marketOrder /
    // limitOrder) lands in a follow-up.
    setSubmitting(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1200))
      router.back()
    } finally {
      setSubmitting(false)
    }
  }, [router])
  return { submitting, submit }
}

const MarketCloseBody = (props: CloseParams): JSX.Element => {
  const { coin, side, price, positionValue, totalPnl } = props
  const { formatCurrency } = useFormatCurrency()
  const { submitting, submit } = useCloseSubmit()

  const [receive, setReceive] = useState(positionValue / 2)
  const fraction = positionValue > 0 ? receive / positionValue : 0
  const estimatedProfit = fraction * totalPnl

  const renderFooter = useCallback(
    () => (
      <SlidingButton
        mode="single"
        label="Slide to close"
        loading={submitting}
        disabled={receive <= 0}
        onConfirm={submit}
        testID="perpetuals_market_close_confirm"
      />
    ),
    [submitting, receive, submit]
  )

  return (
    <ScrollScreen
      isModal
      title="Market close"
      navigationTitle="Market close"
      renderFooter={renderFooter}
      contentContainerStyle={{ padding: 16 }}>
      <View sx={{ paddingTop: 8, gap: 10 }}>
        <PositionPill coin={coin} price={price} side={side} />
        <View
          sx={{
            backgroundColor: '$surfaceSecondary',
            borderRadius: 12,
            paddingVertical: 16
          }}>
          <CircularDial
            value={receive}
            onChange={setReceive}
            max={positionValue}
            label="Receive"
            presets={MARKET_PRESETS}
            enableManualInput
            testID="perpetuals_market_close_amount"
          />
        </View>
        <GroupList
          data={[
            {
              title: 'Receive',
              value: (
                <Text variant="body1" sx={{ color: '$textPrimary' }}>
                  {formatCurrency({ amount: receive })}
                </Text>
              )
            },
            {
              title: 'Estimated profit',
              value: <ProfitText value={estimatedProfit} />
            }
          ]}
        />
      </View>
    </ScrollScreen>
  )
}

const LimitCloseBody = (props: CloseParams): JSX.Element => {
  const { theme } = useTheme()
  const { coin, side, price, entryPrice, positionValue, totalPnl } = props
  const { formatCurrency } = useFormatCurrency()
  const { submitting, submit } = useCloseSubmit()

  const [limitText, setLimitText] = useState('')

  const handleChangeText = useCallback((text: string) => {
    setLimitText(sanitizeDecimalInput(text))
  }, [])

  const limitPrice =
    limitText.length > 0 && Number.isFinite(Number(limitText))
      ? Number(limitText)
      : undefined

  const sizeTokens = price > 0 ? positionValue / price : 0
  const receive = limitPrice !== undefined ? sizeTokens * limitPrice : undefined
  const estimatedProfit =
    limitPrice !== undefined
      ? projectedPnl({
          exitPrice: limitPrice,
          entryPrice,
          sizeTokens,
          isLong: side === 'long'
        })
      : totalPnl

  const renderFooter = useCallback(
    () => (
      <SlidingButton
        mode="single"
        label="Slide to set limit"
        loading={submitting}
        disabled={limitPrice === undefined}
        onConfirm={submit}
        testID="perpetuals_limit_close_confirm"
      />
    ),
    [submitting, limitPrice, submit]
  )

  return (
    <ScrollScreen
      isModal
      title="Limit close"
      navigationTitle="Limit close"
      shouldAvoidKeyboard
      renderFooter={renderFooter}
      contentContainerStyle={{ padding: 16 }}>
      <View sx={{ paddingTop: 8, gap: 10 }}>
        <PositionPill coin={coin} price={price} side={side} />
        <View
          sx={{
            backgroundColor: '$surfaceSecondary',
            borderRadius: 12,
            paddingVertical: 32,
            paddingHorizontal: 16,
            alignItems: 'center',
            gap: 16
          }}>
          <View sx={{ alignItems: 'center', gap: 4 }}>
            <Text variant="caption" sx={{ color: '$textSecondary' }}>
              Set limit price
            </Text>
            <View>
              <AutoSizeTextInput
                prefix="$"
                value={limitText}
                onChangeText={handleChangeText}
                keyboardType="decimal-pad"
                placeholder="0.00"
                autoFocus
                testID="perpetuals_limit_close_price"
              />
            </View>
          </View>
          <View sx={{ flexDirection: 'row', gap: 7 }}>
            {LIMIT_OFFSETS.map(offset => {
              const target = (price * (1 + offset / 100)).toFixed(2)
              const selected = limitText === target
              return (
                <TouchableOpacity
                  key={offset}
                  onPress={() => setLimitText(target)}
                  style={{
                    backgroundColor: selected
                      ? theme.colors.$textPrimary
                      : theme.colors.$borderPrimary,
                    borderRadius: 360,
                    paddingHorizontal: 14,
                    paddingVertical: 6,
                    minWidth: 64,
                    alignItems: 'center'
                  }}>
                  <Text
                    variant="buttonSmall"
                    sx={{
                      color: selected ? '$surfacePrimary' : '$textPrimary'
                    }}>
                    {`+${offset}%`}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>
        <GroupList
          data={[
            {
              title: 'Receive',
              value: (
                <Text variant="body1" sx={{ color: '$textPrimary' }}>
                  {receive !== undefined
                    ? formatCurrency({ amount: receive })
                    : DASH}
                </Text>
              )
            },
            {
              title: 'Estimated profit',
              value: <ProfitText value={estimatedProfit} />
            }
          ]}
        />
      </View>
    </ScrollScreen>
  )
}

export const PerpetualsCloseScreen = (): JSX.Element => {
  const { kind, ...params } = useCloseParams()
  return kind === 'limit' ? (
    <LimitCloseBody {...params} />
  ) : (
    <MarketCloseBody {...params} />
  )
}
