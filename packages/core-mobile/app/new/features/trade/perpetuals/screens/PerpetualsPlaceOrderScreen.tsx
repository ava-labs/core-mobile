import {
  alpha,
  CircularDial,
  GroupList,
  Separator,
  SlidingButton,
  Text,
  Toggle,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { TERMS_OF_USE_URL } from 'common/consts/urls'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import useInAppBrowser from 'common/hooks/useInAppBrowser'
import { showSnackbar } from 'common/utils/toast'
import { useRouter } from 'expo-router'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import HyperliquidLogo from '../../../../assets/icons/hyperliquid-logo.svg'
import { PositionPill } from '../components/PositionPill'
import { TriggerToggleCard } from '../components/TriggerToggleCard'
import { usePlaceOrder } from '../contexts/PlaceOrderContext'
import { usePerpsActiveAssetData } from '../hooks/usePerpsActiveAssetData'
import { usePerpsAvailability } from '../hooks/usePerpsAvailability'
import { usePerpsEnableTradingGate } from '../hooks/usePerpsEnableTradingGate'
import { usePerpsOrderSubmit } from '../hooks/usePerpsOrderSubmit'
import { useHyperliquidMarketContext } from '../hooks/useHyperliquidMarketContext'
import { useTriggerToggles } from '../hooks/useTriggerToggles'
import { tickerOfCoin } from '../utils/coinDex'
import { pctFromEntry, pctParts, positionSizeTokens } from '../utils/economics'
import { roundSizeToSzDecimals, toNumber } from '../utils/format'

const GEO_BLOCKED_MESSAGE =
  'Perpetual Futures are not available in your location.'

const isBlockedBeforeSubmit = async (
  recheckGeoBlock: () => Promise<boolean>
): Promise<boolean> => {
  try {
    return await recheckGeoBlock()
  } catch {
    return true
  }
}

const positionCapacityMessage = (
  isLoading: boolean,
  maxOpenSizeCoin: number | undefined
): string => {
  if (isLoading) {
    return 'Loading position limit…'
  }
  if (maxOpenSizeCoin === 0) {
    return 'No available position capacity'
  }
  return 'Position limit unavailable'
}

/**
 * A limit order costs `limitPx` per contract; a market order costs ~mark.
 * `isLimitOrder` gates both sizing and the submit params on one condition.
 */
const resolveOrderSizing = (
  limitPriceEnabled: boolean,
  limitPrice: number | undefined,
  markPrice: number
): { isLimitOrder: boolean; sizingPrice: number } =>
  limitPriceEnabled && limitPrice !== undefined
    ? { isLimitOrder: true, sizingPrice: limitPrice }
    : { isLimitOrder: false, sizingPrice: markPrice }

// "+x% above/below current price" for the drill row — informational copy for
// the limit's relation to the live mark (falls back to the seeded entry when
// the mark hasn't loaded).
const limitPricePctLabel = (
  limitPrice: number | undefined,
  markPrice: number,
  entryPrice: number
): string => {
  if (limitPrice === undefined) {
    return ''
  }
  const referencePrice = markPrice > 0 ? markPrice : entryPrice
  const { percent, suffix } = pctParts(pctFromEntry(limitPrice, referencePrice))
  return `${percent}${suffix}`
}

/**
 * Keep exactly 1,000 dial intervals so the Max preset lands on HL's precise
 * limit even when it is fractional. A fixed step (for example `$1`) would snap
 * `$150.37` down to `$150` and leave a small unusable remainder.
 */
const positionDialStep = (maxPositionNotionalUsd: number): number =>
  maxPositionNotionalUsd / 1000

export const PerpetualsPlaceOrderScreen = (): JSX.Element => {
  const router = useRouter()
  const { formatCurrency } = useFormatCurrency()
  const [submitting, setSubmitting] = useState(false)

  const {
    coin,
    side,
    entryPrice,
    amount,
    setAmount,
    leverage,
    setLeverage,
    liquidationPrice,
    takeProfitEnabled,
    takeProfitPrice,
    stopLossEnabled,
    stopLossPrice,
    limitPriceEnabled,
    setLimitPriceEnabled,
    limitPrice
  } = usePlaceOrder()

  // Seed the displayed leverage from Hyperliquid's actual per-coin value once,
  // so it reflects HL rather than the local default before the user edits it.
  const {
    leverage: hlLeverage,
    maxBuySizeCoin,
    maxSellSizeCoin,
    isLoading: activeAssetLoading
  } = usePerpsActiveAssetData(coin)
  const seededLeverageRef = useRef(false)
  useEffect(() => {
    if (seededLeverageRef.current || hlLeverage === undefined) {
      return
    }
    seededLeverageRef.current = true
    setLeverage(hlLeverage)
  }, [hlLeverage, setLeverage])

  const { isGeoBlocked, recheckGeoBlock } = usePerpsAvailability()
  const { submitOrder } = usePerpsOrderSubmit()
  const { requireTradingEnabled, enableTradingModal } =
    usePerpsEnableTradingGate()

  // Live market data for the coin: the current mark price to size the order and
  // `szDecimals` to quantize the size. Both come from Hyperliquid — there is no
  // fallback to the seeded/placeholder price, so sizing is only ever computed
  // from real market data (the confirm button stays disabled until it loads).
  const { universe, assetCtx } = useHyperliquidMarketContext(coin)
  const szDecimals = universe?.szDecimals
  const markPrice = toNumber(assetCtx?.markPx)
  // Also require leverage (> 0), which is seeded from HL rather than a local
  // default, before allowing a submit or sizing the order.
  const marketDataReady =
    markPrice > 0 && szDecimals !== undefined && leverage > 0

  const isLong = side === 'long'
  const maxOpenSizeCoin = isLong ? maxBuySizeCoin : maxSellSizeCoin
  const { isLimitOrder, sizingPrice } = resolveOrderSizing(
    limitPriceEnabled,
    limitPrice,
    markPrice
  )
  // Capacity is denominated at the same effective entry price the order is
  // sized at: the limit price when a limit is enabled, otherwise the mark.
  // Using the mark unconditionally would let a full dial (at maxOpenSizeCoin
  // notional/mark) convert to more contracts than maxOpenSizeCoin once
  // divided by a lower limit price, exceeding HL's per-asset size cap.
  const maxPositionNotionalUsd =
    maxOpenSizeCoin !== undefined && sizingPrice > 0
      ? maxOpenSizeCoin * sizingPrice
      : undefined
  const orderCapacityReady =
    maxPositionNotionalUsd !== undefined && maxPositionNotionalUsd > 0
  const amountExceedsCapacity =
    maxPositionNotionalUsd !== undefined && amount > maxPositionNotionalUsd
  const capacityMessage = positionCapacityMessage(
    activeAssetLoading,
    maxOpenSizeCoin
  )
  const dialStep =
    maxPositionNotionalUsd !== undefined
      ? positionDialStep(maxPositionNotionalUsd)
      : undefined
  // `amount` is the USD position notional from the dial. Convert it to
  // contract size via notional / sizing price, then quantize to the coin's
  // szDecimals (HL rejects sizes with extra fractional precision).
  const sizeContracts = marketDataReady
    ? roundSizeToSzDecimals(positionSizeTokens(amount, sizingPrice), szDecimals)
    : 0

  const limitPriceLabel = limitPricePctLabel(limitPrice, markPrice, entryPrice)
  const directionLabel = isLong ? 'Long' : 'Short'
  const subtitle = `You're predicting the price of ${tickerOfCoin(
    coin
  )} will go ${isLong ? 'up' : 'down'}`

  const handleAddLeverage = useCallback(() => {
    router.navigate('/perpetualsPlaceOrder/leverage')
  }, [router])

  const handleOpenTakeProfit = useCallback(() => {
    router.navigate('/perpetualsPlaceOrder/trigger?kind=takeProfit')
  }, [router])

  const handleOpenStopLoss = useCallback(() => {
    router.navigate('/perpetualsPlaceOrder/trigger?kind=stopLoss')
  }, [router])

  const { takeProfit, stopLoss } = useTriggerToggles({
    openTakeProfit: handleOpenTakeProfit,
    openStopLoss: handleOpenStopLoss
  })

  const handleOpenLimitPrice = useCallback(() => {
    router.navigate('/perpetualsPlaceOrder/limitPrice')
  }, [router])

  // Mirrors useTriggerToggles: on with no price opens the editor (enabled only
  // flips once a price is confirmed there), on with a price re-enables, off
  // keeps the price for re-enable.
  const handleToggleLimitPrice = useCallback(
    (next: boolean) => {
      if (!next) {
        setLimitPriceEnabled(false)
      } else if (limitPrice !== undefined) {
        setLimitPriceEnabled(true)
      } else {
        handleOpenLimitPrice()
      }
    },
    [limitPrice, setLimitPriceEnabled, handleOpenLimitPrice]
  )

  const handleConfirm = useCallback(async () => {
    setSubmitting(true)
    try {
      // Re-check geo fresh (bypassing the 5-min cache) right before submitting
      // — the user may have toggled a VPN since the screen loaded. Abort and
      // surface the restriction rather than placing an order. A re-check that
      // fails outright counts as blocked (fail closed).
      const blocked = await isBlockedBeforeSubmit(recheckGeoBlock)
      if (blocked) {
        showSnackbar(GEO_BLOCKED_MESSAGE)
        return
      }
      // Gate on the one-time setup (agent + Markr builder fee + unified
      // account). If trading isn't enabled yet, surface the enable-trading flow
      // instead of placing the order; the user re-slides once setup completes.
      if (!requireTradingEnabled()) {
        return
      }
      // A market order sized from the position-notional dial, with optional TP/SL
      // attached when their toggles are on. The manager signs via the agent
      // key (or the master-wallet fallback) and refreshes balances on success.
      const ok = await submitOrder({
        coin,
        isLong,
        sizeContracts,
        leverage,
        orderKind: isLimitOrder ? 'limit' : 'market',
        limitPx: isLimitOrder ? limitPrice : undefined,
        takeProfitPx: takeProfitEnabled ? takeProfitPrice : undefined,
        stopLossPx: stopLossEnabled ? stopLossPrice : undefined
      })
      if (ok) {
        router.back()
      }
    } finally {
      setSubmitting(false)
    }
  }, [
    router,
    recheckGeoBlock,
    submitOrder,
    requireTradingEnabled,
    coin,
    isLong,
    sizeContracts,
    leverage,
    isLimitOrder,
    limitPrice,
    takeProfitEnabled,
    takeProfitPrice,
    stopLossEnabled,
    stopLossPrice
  ])

  const renderFooter = useCallback(
    () => (
      <SlidingButton
        mode="single"
        label={`Slide to buy ${directionLabel}`}
        loading={submitting}
        disabled={
          amount <= 0 ||
          isGeoBlocked ||
          !marketDataReady ||
          !orderCapacityReady ||
          amountExceedsCapacity
        }
        onConfirm={handleConfirm}
        testID="perpetuals_place_order_confirm"
      />
    ),
    [
      directionLabel,
      submitting,
      amount,
      isGeoBlocked,
      marketDataReady,
      orderCapacityReady,
      amountExceedsCapacity,
      handleConfirm
    ]
  )

  const leverageBadge = (
    <View
      sx={{
        backgroundColor: '$borderPrimary',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 4
      }}>
      <Text variant="buttonSmall" sx={{ color: '$textPrimary' }}>
        {leverage > 0 ? `${leverage}×` : '-'}
      </Text>
    </View>
  )

  return (
    <>
      <ScrollScreen
        isModal
        title="Place your bet"
        subtitle={subtitle}
        navigationTitle="Place your bet"
        renderFooter={renderFooter}
        contentContainerStyle={{ padding: 16 }}>
        <View sx={{ paddingTop: 8, gap: 20 }}>
          <View sx={{ gap: 8 }}>
            <PositionPill coin={coin} price={entryPrice} side={side} />

            <View sx={{ gap: 4 }}>
              <View
                sx={{
                  backgroundColor: '$surfaceSecondary',
                  borderRadius: 12,
                  overflow: 'hidden'
                }}>
                <View
                  sx={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 14
                  }}>
                  <Text variant="subtitle1" sx={{ fontSize: 16 }}>
                    Set limit price
                  </Text>
                  <Toggle
                    value={limitPriceEnabled}
                    onValueChange={handleToggleLimitPrice}
                    testID="perpetuals_place_order_limit_toggle"
                  />
                </View>

                {limitPriceEnabled && limitPrice !== undefined ? (
                  <>
                    <Separator sx={{ marginHorizontal: 16 }} />
                    <TouchableOpacity
                      onPress={handleOpenLimitPrice}
                      testID="perpetuals_place_order_limit_drill">
                      <View
                        sx={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 12,
                          paddingHorizontal: 16,
                          paddingVertical: 14
                        }}>
                        <View sx={{ gap: 2 }}>
                          <Text variant="subtitle1" sx={{ fontSize: 16 }}>
                            Price
                          </Text>
                          <Text
                            variant="caption"
                            sx={{ color: '$textSecondary' }}>
                            {limitPriceLabel}
                          </Text>
                        </View>
                        <Text variant="body1" sx={{ color: '$textSecondary' }}>
                          {formatCurrency({ amount: limitPrice })}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </>
                ) : null}

                <Separator sx={{ marginHorizontal: 16 }} />
                <View sx={{ paddingVertical: 16 }}>
                  {orderCapacityReady ? (
                    <CircularDial
                      value={amount}
                      onChange={setAmount}
                      max={maxPositionNotionalUsd}
                      label="USD"
                      enableManualInput
                      testID="perpetuals_place_order_amount"
                      step={dialStep}
                    />
                  ) : (
                    <View
                      testID="perpetuals_place_order_capacity_unavailable"
                      sx={{
                        minHeight: 48,
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                      <Text variant="body2" sx={{ color: '$textSecondary' }}>
                        {capacityMessage}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              <Text
                variant="caption"
                sx={{ color: '$textSecondary', textAlign: 'center' }}>
                {maxPositionNotionalUsd === undefined
                  ? 'Maximum position: —'
                  : `Maximum position: ${formatCurrency({
                      amount: maxPositionNotionalUsd
                    })}`}
              </Text>
            </View>
          </View>

          <View sx={{ gap: 20 }}>
            <GroupList
              titleSx={{ fontFamily: 'Inter-Regular' }}
              subtitleVariant="caption"
              data={[
                {
                  title: 'Add leverage',
                  subtitle: `Est. liquidation at ${formatCurrency({
                    amount: liquidationPrice
                  })}`,
                  onPress: handleAddLeverage,
                  value: leverageBadge
                }
              ]}
            />

            <TriggerToggleCard
              title="Add take profit"
              subtitle="Price target at which your position will automatically close and lock in your gains"
              enabled={takeProfit.enabled}
              onToggle={takeProfit.onToggle}
              drillLabel="Price target"
              drillValue={takeProfit.drillValue}
              onPressDrill={handleOpenTakeProfit}
              testID="perpetuals_place_order_take_profit"
            />

            <TriggerToggleCard
              title="Add stop loss"
              subtitle="Price level at which your position automatically closes to cap your losses"
              enabled={stopLoss.enabled}
              onToggle={stopLoss.onToggle}
              drillLabel="Stop price"
              drillValue={stopLoss.drillValue}
              onPressDrill={handleOpenStopLoss}
              testID="perpetuals_place_order_stop_loss"
            />
          </View>
          <TermsOfUseText />
        </View>
      </ScrollScreen>
      {enableTradingModal}
    </>
  )
}

const TermsOfUseText = (): JSX.Element => {
  const { theme } = useTheme()
  const { openUrl } = useInAppBrowser()

  const openTermsOfUse = useCallback(() => {
    openUrl(TERMS_OF_USE_URL)
  }, [openUrl])

  return (
    <View sx={{ gap: 20 }}>
      <Text variant="caption" style={{ textAlign: 'center' }}>
        {`By trading, you agree to the `}
        <Text
          variant="caption"
          onPress={openTermsOfUse}
          suppressHighlighting
          style={{ textDecorationLine: 'underline' }}
          testID="perpetuals_place_order_terms_link">
          Terms of Use
        </Text>
        {`.\nPerpetual futures involve unique risks.`}
      </Text>
      <View
        sx={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 7,
          height: 32
        }}>
        <Text
          variant="caption"
          sx={{
            color: '$textSecondary'
          }}>
          Powered by
        </Text>
        <HyperliquidLogo color={alpha(theme.colors.$textPrimary, 0.6)} />
      </View>
    </View>
  )
}
