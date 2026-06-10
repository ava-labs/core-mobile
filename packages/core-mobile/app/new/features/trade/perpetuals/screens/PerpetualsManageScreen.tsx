import {
  alpha,
  Button,
  GroupList,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { TokenLogo } from 'common/components/TokenLogo'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useCallback, useState } from 'react'
import { TriggerToggleCard } from '../components/TriggerToggleCard'
import { usePlaceOrder } from '../contexts/PlaceOrderContext'
import { useTriggerToggles } from '../hooks/useTriggerToggles'
import { formatSigned, pnlColor } from '../utils/economics'

export const PerpetualsManageScreen = (): JSX.Element => {
  const { theme } = useTheme()
  const router = useRouter()
  const { formatCurrency } = useFormatCurrency()
  const [submitting, setSubmitting] = useState(false)

  const params = useLocalSearchParams<{ size?: string; pnl?: string }>()
  // Finite parse so deep-linked junk (e.g. `Infinity`) doesn't render as a
  // value or poison `pnlPct` with `NaN`.
  const toFinite = (value: string | undefined): number => {
    const n = Number(value)
    return Number.isFinite(n) ? n : 0
  }
  const size = toFinite(params.size)
  const pnl = toFinite(params.pnl)

  const { coin, side, entryPrice, leverage } = usePlaceOrder()

  const isLong = side === 'long'
  const notional = size * entryPrice
  const pnlPct = notional > 0 ? (pnl / notional) * 100 : 0
  const profitColor = pnlColor(pnl, theme.colors, theme.colors.$textPrimary)
  const formattedPnl = formatSigned(pnl, n => formatCurrency({ amount: n }))

  const handleOpenTakeProfit = useCallback(() => {
    router.navigate('/perpetualsManage/trigger?kind=takeProfit')
  }, [router])

  const handleOpenStopLoss = useCallback(() => {
    router.navigate('/perpetualsManage/trigger?kind=stopLoss')
  }, [router])

  const { takeProfit, stopLoss } = useTriggerToggles({
    openTakeProfit: handleOpenTakeProfit,
    openStopLoss: handleOpenStopLoss
  })

  const handleUpdate = useCallback(async () => {
    // UI-only: simulate the update. SDK wiring (updateLeverage /
    // setPositionTpSl) lands in a follow-up.
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
      <View sx={{ flexDirection: 'row', gap: 12 }}>
        <Button
          type="secondary"
          size="large"
          testID="perpetuals_manage_cancel"
          onPress={() => router.back()}
          style={{ flex: 1 }}>
          Cancel
        </Button>
        <Button
          type="primary"
          size="large"
          disabled={submitting}
          testID="perpetuals_manage_update"
          onPress={handleUpdate}
          style={{ flex: 1 }}>
          Update position
        </Button>
      </View>
    ),
    [router, submitting, handleUpdate]
  )

  return (
    <ScrollScreen
      isModal
      title="Manage position"
      navigationTitle="Manage position"
      renderFooter={renderFooter}
      contentContainerStyle={{ padding: 16 }}>
      <View sx={{ paddingTop: 8, gap: 10 }}>
        <View
          sx={{
            backgroundColor: '$surfaceSecondary',
            borderRadius: 12,
            padding: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
          <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TokenLogo size={32} symbol={coin} />
            <View sx={{ gap: 2 }}>
              <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text variant="buttonMedium">{coin}</Text>
                <View
                  style={{
                    backgroundColor: alpha(
                      isLong
                        ? theme.colors.$textSuccess
                        : theme.colors.$textDanger,
                      0.1
                    ),
                    borderRadius: 6,
                    paddingHorizontal: 6,
                    paddingVertical: 2
                  }}>
                  <Text
                    variant="caption"
                    sx={{ color: isLong ? '$textSuccess' : '$textDanger' }}>
                    {isLong ? 'Long' : 'Short'}
                  </Text>
                </View>
              </View>
              <Text variant="caption" sx={{ color: '$textSecondary' }}>
                {`${leverage}x`}
              </Text>
            </View>
          </View>
          <View sx={{ alignItems: 'flex-end', gap: 2 }}>
            <Text variant="buttonMedium">
              {formatCurrency({ amount: entryPrice })}
            </Text>
            <Text variant="caption" sx={{ color: profitColor }}>
              {formattedPnl}
            </Text>
          </View>
        </View>

        <GroupList
          titleSx={{ fontFamily: 'Inter-Regular' }}
          data={[
            {
              title: 'Size',
              value: <Text variant="body1">{`${size} ${coin}`}</Text>
            },
            {
              title: 'Entry price',
              value: (
                <Text variant="body1">
                  {formatCurrency({ amount: entryPrice })}
                </Text>
              )
            },
            {
              title: 'Estimated profit',
              value: (
                <Text variant="body1" sx={{ color: profitColor }}>
                  {`${formattedPnl} (${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(
                    1
                  )}%)`}
                </Text>
              )
            }
          ]}
        />

        <View sx={{ gap: 10 }}>
          <TriggerToggleCard
            title="Set take profit"
            subtitle="Price target at which your position will automatically close and lock in your gains"
            enabled={takeProfit.enabled}
            onToggle={takeProfit.onToggle}
            drillLabel="Price target"
            drillValue={takeProfit.drillValue}
            onPressDrill={handleOpenTakeProfit}
            testID="perpetuals_manage_take_profit"
          />

          <TriggerToggleCard
            title="Set stop loss"
            subtitle="Price level at which your position automatically closes to cap your losses"
            enabled={stopLoss.enabled}
            onToggle={stopLoss.onToggle}
            drillLabel="Stop price"
            drillValue={stopLoss.drillValue}
            onPressDrill={handleOpenStopLoss}
            testID="perpetuals_manage_stop_loss"
          />
        </View>
      </View>
    </ScrollScreen>
  )
}
