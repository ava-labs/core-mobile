import { TokenUnit } from '@avalabs/core-utils-sdk'
import {
  ActivityIndicator,
  alpha,
  Button,
  GroupList,
  PriceChangeStatus,
  SegmentedControl,
  StatusArrow,
  Text,
  TokenUnitInputWidget,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import type { AssetPosition } from '@avalabs/perps-sdk'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { useRouter } from 'expo-router'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import { useSharedValue } from 'react-native-reanimated'
import { formatNumber } from 'utils/formatNumber/formatNumber'
import { DexBadge } from '../components/DexBadge'
import { PerpsCoinLogo } from '../components/PerpsCoinLogo'
import { usePlaceOrder } from '../contexts/PlaceOrderContext'
import { usePerpsEnableTradingGate } from '../hooks/usePerpsEnableTradingGate'
import { usePerpsPositionActions } from '../hooks/usePerpsPositionActions'
import { usePerpsPositions } from '../hooks/usePerpsPositions'
import { dexOfCoin, tickerOfCoin } from '../utils/coinDex'
import {
  estimateLiquidationPriceFromMargin,
  floorToDecimals,
  maxRemovableMarginUsd
} from '../utils/economics'
import { toNumber } from '../utils/format'

type AdjustMode = 'add' | 'remove'

const MODES: AdjustMode[] = ['add', 'remove']
const MODE_ITEMS = [{ title: 'Add' }, { title: 'Remove' }]

/** USDC margin amounts are entered/submitted with 2 decimals (cents). */
const AMOUNT_DECIMALS = 2
// Empty symbol: the design captions the amount ("Amount to add in USDC")
// below the input instead of suffixing every keystroke.
const AMOUNT_TOKEN = { maxDecimals: AMOUNT_DECIMALS, symbol: '' }

// Fractions of the active mode's max, resolved against the live `balance`
// prop at press time so they stay correct as the max updates.
const AMOUNT_PRESETS = [
  { label: '25%', percent: 0.25 },
  { label: '50%', percent: 0.5 },
  { label: '100%', percent: 1 }
] as const

const toAmountUnit = (amount: number): TokenUnit =>
  new TokenUnit(
    Math.round(amount * 10 ** AMOUNT_DECIMALS),
    AMOUNT_DECIMALS,
    AMOUNT_TOKEN.symbol
  )

/**
 * The caption under the amount card. Explains *why* nothing can be entered
 * instead of a bare "Balance: 0.00": adding needs free account collateral,
 * and a position at its set leverage sits exactly at Hyperliquid's required
 * margin, so nothing is removable until margin is added on top or the
 * position gains unrealized profit. `isDanger` renders the blocking cases
 * (over max, nothing to add/remove) in the danger color.
 */
const buildHelperText = ({
  mode,
  exceedsMax,
  maxForMode,
  withdrawableUsd,
  isWithdrawableLoading
}: {
  mode: AdjustMode
  exceedsMax: boolean
  maxForMode: number
  withdrawableUsd: number | undefined
  isWithdrawableLoading: boolean
}): { text: string; isDanger: boolean } => {
  if (exceedsMax) {
    return {
      text:
        mode === 'add'
          ? 'Amount exceeds your available balance'
          : 'Amount exceeds the margin available to remove',
      isDanger: true
    }
  }
  if (maxForMode > 0) {
    return {
      text: `Balance: ${formatNumber(Math.max(0, withdrawableUsd ?? 0))} USDC`,
      isDanger: false
    }
  }
  if (mode === 'remove') {
    return {
      text: 'No margin available to remove',
      isDanger: true
    }
  }
  return isWithdrawableLoading
    ? { text: 'Balance: -', isDanger: false }
    : {
        text: 'No balance available to add',
        isDanger: true
      }
}

/**
 * Add or remove isolated USDC margin for an open position to change its
 * liquidation risk. Only reachable for isolated positions (the Manage screen
 * gates its Margin row); submits a signed USD delta through
 * `updateIsolatedMargin` — positive adds, negative removes.
 */
export const PerpetualsAdjustMarginScreen = (): JSX.Element => {
  const { theme } = useTheme()
  const router = useRouter()
  const { formatCurrency } = useFormatCurrency()
  // `coin` / `maxLeverage` come from the manage layout's shared context —
  // maxLeverage is the market cap that drives the liquidation estimate.
  const { coin, maxLeverage } = usePlaceOrder()
  const { positions, withdrawableUsd, isWithdrawableLoading } =
    usePerpsPositions()
  const { updateIsolatedMargin, busy } = usePerpsPositionActions()
  const { requireTradingEnabled, enableTradingModal } =
    usePerpsEnableTradingGate()

  const [mode, setMode] = useState<AdjustMode>('add')
  const selectedSegmentIndex = useSharedValue(0)
  /** Amount in USDC; `0` is treated as empty. */
  const [amount, setAmount] = useState(0)

  // Live clearinghouse position (kept current over WS) so margin / PnL /
  // liquidation stay fresh while the sheet is open. Falls back to the last
  // seen snapshot during transient refetches so the sheet never blanks.
  const livePosition = useMemo(
    () =>
      positions.find(p => p.position.coin.toUpperCase() === coin.toUpperCase())
        ?.position,
    [positions, coin]
  )
  const snapshotRef = useRef<AssetPosition['position'] | undefined>(undefined)
  if (livePosition !== undefined) {
    snapshotRef.current = livePosition
  }
  const position = livePosition ?? snapshotRef.current

  const szi = toNumber(position?.szi)
  const isLong = szi >= 0
  const entryPrice = toNumber(position?.entryPx)
  const marginUsed = toNumber(position?.marginUsed)
  const setLeverage = position?.leverage.value ?? 0

  // Position notional backing the maintenance-margin / liquidation math.
  // Prefer the exchange-reported value; fall back to size × entry.
  const notionalUsd = useMemo(() => {
    const reported = Math.abs(toNumber(position?.positionValue))
    return reported > 0 ? reported : Math.abs(szi) * entryPrice
  }, [position?.positionValue, szi, entryPrice])

  const maxForMode = useMemo(() => {
    const max =
      mode === 'add'
        ? Math.max(0, withdrawableUsd ?? 0)
        : maxRemovableMarginUsd({
            marginUsed,
            unrealizedPnl: toNumber(position?.unrealizedPnl),
            notionalUsd,
            leverage: setLeverage
          })
    // Floored to the input precision so the 100% preset can't round up past
    // the true cap and trip validation / HL's margin-reduction check.
    return floorToDecimals(max, AMOUNT_DECIMALS)
  }, [
    mode,
    withdrawableUsd,
    marginUsed,
    position?.unrealizedPnl,
    notionalUsd,
    setLeverage
  ])

  const currentLiqPx = toNumber(position?.liquidationPx)
  const projectedLiqPx = useMemo(() => {
    if (amount <= 0 || maxLeverage <= 0) {
      return Number.NaN
    }
    const newMargin = mode === 'add' ? marginUsed + amount : marginUsed - amount
    return estimateLiquidationPriceFromMargin({
      entryPrice,
      isLong,
      maxLeverage,
      notionalUsd,
      marginUsd: newMargin
    })
  }, [amount, mode, marginUsed, entryPrice, isLong, maxLeverage, notionalUsd])

  const exceedsMax = amount > maxForMode + 1e-9
  const canSubmit = position !== undefined && amount > 0 && !exceedsMax && !busy

  const helperText = buildHelperText({
    mode,
    exceedsMax,
    maxForMode,
    withdrawableUsd,
    isWithdrawableLoading
  })

  const handleSelectMode = useCallback(
    (index: number) => {
      selectedSegmentIndex.value = index
      setMode(MODES[index] ?? 'add')
      // The widget is remounted via `key={mode}`, clearing the typed value.
      setAmount(0)
    },
    [selectedSegmentIndex]
  )

  const handleAmountChange = useCallback((value: TokenUnit): void => {
    setAmount(value.toDisplay({ asNumber: true }))
  }, [])

  const amountCaption = useCallback(
    (): string => `Amount to ${mode} in USDC`,
    [mode]
  )

  const handleConfirm = useCallback(async () => {
    if (!canSubmit) {
      return
    }
    // Adjusting margin signs an L1 action, so ensure trading is set up first.
    if (!requireTradingEnabled()) {
      return
    }
    const ok = await updateIsolatedMargin(
      coin,
      mode === 'add' ? amount : -amount
    )
    if (ok) {
      router.back()
    }
  }, [
    canSubmit,
    requireTradingEnabled,
    updateIsolatedMargin,
    coin,
    mode,
    amount,
    router
  ])

  const renderFooter = useCallback(
    () => (
      <Button
        type="primary"
        size="large"
        disabled={!canSubmit}
        testID="perpetuals_adjust_margin_confirm"
        onPress={handleConfirm}>
        {busy ? <ActivityIndicator size="small" /> : 'Confirm'}
      </Button>
    ),
    [canSubmit, busy, handleConfirm]
  )

  const liquidationValue = (
    <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Text variant="body1">
        {currentLiqPx > 0 ? formatCurrency({ amount: currentLiqPx }) : '—'}
      </Text>
      {Number.isFinite(projectedLiqPx) && (
        <>
          <Text variant="body1" sx={{ color: '$textSecondary' }}>
            →
          </Text>
          <Text
            variant="body1"
            sx={{ color: mode === 'add' ? '$textSuccess' : '$textDanger' }}>
            {formatCurrency({ amount: projectedLiqPx })}
          </Text>
        </>
      )}
    </View>
  )

  return (
    <>
      <ScrollScreen
        isModal
        title="Adjust margin"
        navigationTitle="Adjust margin"
        subtitle="Add or remove USDC to change the liquidation risk of this position"
        shouldAvoidKeyboard
        renderFooter={renderFooter}
        contentContainerStyle={{ padding: 16 }}>
        <View sx={{ paddingTop: 8, gap: 10 }}>
          <View sx={{ gap: 4 }}>
            <View
              sx={{
                backgroundColor: '$surfaceSecondary',
                borderRadius: 12,
                borderBottomLeftRadius: 4,
                borderBottomRightRadius: 4,
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center'
              }}>
              <PerpsCoinLogo size={32} symbol={coin} />
              <View sx={{ marginLeft: 10, flex: 1, gap: 2 }}>
                <View
                  sx={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text variant="body2" sx={{ fontFamily: 'Inter-Medium' }}>
                    {`${tickerOfCoin(coin)}-USDC`}
                  </Text>
                  <DexBadge dex={dexOfCoin(coin)} />
                </View>
                <View
                  sx={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    alignSelf: 'flex-start',
                    gap: 8
                  }}>
                  <View
                    sx={{
                      backgroundColor: alpha(theme.colors.$textPrimary, 0.1),
                      borderRadius: 6,
                      paddingHorizontal: 6,
                      paddingVertical: 2
                    }}>
                    <Text variant="caption" sx={{ fontFamily: 'Inter-Medium' }}>
                      {`${setLeverage}×`}
                    </Text>
                  </View>
                  <Text
                    variant="caption"
                    sx={{
                      color: '$textSecondary',
                      fontFamily: 'Inter-Medium'
                    }}>
                    Isolated
                  </Text>
                </View>
              </View>
              <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text variant="heading3">{isLong ? 'Long' : 'Short'}</Text>
                <StatusArrow
                  status={
                    isLong ? PriceChangeStatus.Up : PriceChangeStatus.Down
                  }
                  size={16}
                />
              </View>
            </View>

            <View
              sx={{
                backgroundColor: '$surfaceSecondary',
                borderRadius: 12,
                borderTopLeftRadius: 4,
                borderTopRightRadius: 4,
                paddingTop: 20
              }}>
              <SegmentedControl
                items={MODE_ITEMS}
                selectedSegmentIndex={selectedSegmentIndex}
                onSelectSegment={handleSelectMode}
                dynamicItemWidth={false}
                type="thin"
                backgroundColor={alpha(theme.colors.$textPrimary, 0.1)}
                style={{ alignSelf: 'center', width: 150 }}
                height={27}
              />
              <TokenUnitInputWidget
                key={mode}
                autoFocus
                token={AMOUNT_TOKEN}
                balance={toAmountUnit(maxForMode)}
                onChange={handleAmountChange}
                formatInCurrency={amountCaption}
                presets={AMOUNT_PRESETS}
                valid={!exceedsMax}
                cardSx={{ backgroundColor: 'transparent', paddingTop: 12 }}
              />
            </View>
          </View>

          <Text
            variant="caption"
            sx={{
              textAlign: 'center',
              color: helperText.isDanger ? '$textDanger' : '$textPrimary'
            }}>
            {helperText.text}
          </Text>

          <GroupList
            titleSx={{ fontFamily: 'Inter-Regular' }}
            data={[
              {
                title: `Current margin for ${tickerOfCoin(coin)}`,
                value: (
                  <Text variant="body1">
                    {`${formatNumber(marginUsed)} USDC`}
                  </Text>
                )
              },
              {
                title:
                  mode === 'add'
                    ? 'Margin available to add'
                    : 'Margin available to remove',
                value: (
                  <Text variant="body1">
                    {`${formatNumber(maxForMode)} USDC`}
                  </Text>
                )
              },
              {
                title: 'Liquidation price',
                value: liquidationValue
              }
            ]}
          />

          <Text variant="caption" sx={{ color: '$textSecondary' }}>
            Adjusting margin only changes this position's collateral and
            liquidation price - your entry price, size, and unrealized PnL are
            unchanged.
          </Text>
        </View>
      </ScrollScreen>
      {enableTradingModal}
    </>
  )
}
