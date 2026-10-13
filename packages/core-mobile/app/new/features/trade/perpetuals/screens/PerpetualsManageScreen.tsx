import {
  ActivityIndicator,
  alpha,
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
import { TriggerToggleCard } from '../components/TriggerToggleCard'
import { usePlaceOrder } from '../contexts/PlaceOrderContext'
import { usePerpsAllOpenOrders } from '../hooks/usePerpsAllOpenOrders'
import { usePerpsEnableTradingGate } from '../hooks/usePerpsEnableTradingGate'
import { usePerpsPositionActions } from '../hooks/usePerpsPositionActions'
import { useTriggerToggles } from '../hooks/useTriggerToggles'
import { dexOfCoin, tickerOfCoin } from '../utils/coinDex'
import { DexBadge } from '../components/DexBadge'
import { PerpsCoinLogo } from '../components/PerpsCoinLogo'
import { formatSigned, pnlColor } from '../utils/economics'
import { extractPositionTriggerOrders } from '../utils/toPosition'

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

  const {
    coin,
    side,
    entryPrice,
    leverage,
    takeProfitEnabled,
    takeProfitPrice,
    initialTakeProfitPrice,
    stopLossEnabled,
    stopLossPrice,
    initialStopLossPrice
  } = usePlaceOrder()

  // Has the user changed anything? Compare the *effective* TP/SL against the
  // seeded baseline: a price only counts while its toggle is on, so disabling
  // a trigger reverts to "no price" (undefined) and matches the seed again —
  // even if a stale price value lingers in state.
  const effectiveTakeProfitPrice = takeProfitEnabled
    ? takeProfitPrice
    : undefined
  const effectiveStopLossPrice = stopLossEnabled ? stopLossPrice : undefined
  const tpChanged = effectiveTakeProfitPrice !== initialTakeProfitPrice
  const slChanged = effectiveStopLossPrice !== initialStopLossPrice

  // The position's existing on-book TP/SL triggers (with order ids). A changed
  // or turned-off side must cancel its existing trigger — HL has no modify, so
  // editing is cancel + re-place, and re-placing alone would either duplicate
  // the leg (price change) or leave the old one resting (side cleared).
  const { orders: openOrders } = usePerpsAllOpenOrders()
  const existingTriggers = useMemo(
    () => extractPositionTriggerOrders(coin, openOrders),
    [coin, openOrders]
  )

  const cancelOids = useMemo(() => {
    const oids: number[] = []
    if (existingTriggers.takeProfit !== undefined && tpChanged) {
      oids.push(existingTriggers.takeProfit.oid)
    }
    if (existingTriggers.stopLoss !== undefined && slChanged) {
      oids.push(existingTriggers.stopLoss.oid)
    }
    return oids
  }, [existingTriggers, tpChanged, slChanged])

  // Only place a side that is enabled AND changed — leaving an untouched side
  // out avoids re-sending (and thus duplicating) it. A cleared side has an
  // `undefined` effective price, so it cancels (above) without re-placing.
  const takeProfitToPlace = tpChanged ? effectiveTakeProfitPrice : undefined
  const stopLossToPlace = slChanged ? effectiveStopLossPrice : undefined
  const hasPlacement =
    takeProfitToPlace !== undefined || stopLossToPlace !== undefined
  const hasAction = cancelOids.length > 0 || hasPlacement

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

  const { updatePositionTpSl } = usePerpsPositionActions()
  const { requireTradingEnabled, enableTradingModal } =
    usePerpsEnableTradingGate()

  const handleUpdate = useCallback(async () => {
    if (!hasAction) {
      return
    }
    // Setting TP/SL signs an L1 order, so ensure trading is set up first.
    if (!requireTradingEnabled()) {
      return
    }
    setSubmitting(true)
    try {
      const ok = await updatePositionTpSl({
        coin,
        sizeContracts: size,
        positionIsLong: isLong,
        cancelOids,
        takeProfitPx: takeProfitToPlace,
        stopLossPx: stopLossToPlace
      })
      if (ok) {
        router.back()
      }
    } finally {
      setSubmitting(false)
    }
  }, [
    hasAction,
    requireTradingEnabled,
    router,
    updatePositionTpSl,
    coin,
    size,
    isLong,
    cancelOids,
    takeProfitToPlace,
    stopLossToPlace
  ])

  const renderFooter = useCallback(
    () => (
      <View sx={{ flexDirection: 'row', gap: 12 }}>
        <Button
          type="secondary"
          size="large"
          disabled={submitting}
          testID="perpetuals_manage_cancel"
          onPress={() => router.back()}
          style={{ flex: 1 }}>
          Cancel
        </Button>
        <Button
          type="primary"
          size="large"
          disabled={!hasAction || submitting}
          testID="perpetuals_manage_update"
          onPress={handleUpdate}
          style={{ flex: 1 }}>
          {submitting ? <ActivityIndicator size="small" /> : 'Update position'}
        </Button>
      </View>
    ),
    [router, hasAction, submitting, handleUpdate]
  )

  return (
    <>
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
              <PerpsCoinLogo size={32} symbol={coin} />
              <View sx={{ gap: 2 }}>
                <View
                  sx={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text variant="buttonMedium">{tickerOfCoin(coin)}</Text>
                  <DexBadge dex={dexOfCoin(coin)} />
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
                value: (
                  <Text variant="body1">{`${size} ${tickerOfCoin(coin)}`}</Text>
                )
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
                    {`${formattedPnl} (${
                      pnlPct >= 0 ? '+' : ''
                    }${pnlPct.toFixed(1)}%)`}
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
      {enableTradingModal}
    </>
  )
}
