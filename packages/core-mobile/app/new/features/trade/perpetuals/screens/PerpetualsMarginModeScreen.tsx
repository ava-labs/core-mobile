import { Button, GroupList, Icons, useTheme, View } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useRouter } from 'expo-router'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePlaceOrder, type MarginMode } from '../contexts/PlaceOrderContext'
import { useHyperliquidMarketContext } from '../hooks/useHyperliquidMarketContext'
import { usePerpsActiveAssetData } from '../hooks/usePerpsActiveAssetData'
import { usePerpsPositionActions } from '../hooks/usePerpsPositionActions'
import { usePerpsPositions } from '../hooks/usePerpsPositions'

export const PerpetualsMarginModeScreen = (): JSX.Element => {
  const router = useRouter()
  const { theme } = useTheme()
  const { coin, leverage, marginMode, setMarginMode } = usePlaceOrder()
  const { updateLeverage, busy } = usePerpsPositionActions()
  const { leverageType } = usePerpsActiveAssetData(coin)
  const { universe } = useHyperliquidMarketContext(coin)
  const { positions } = usePerpsPositions()

  // Some (HIP-3) markets are isolated-only: cross margin is disabled on-exchange.
  const onlyIsolated = universe?.onlyIsolated === true

  // Hyperliquid rejects margin-mode changes while a position is open in the
  // market. The sheet still opens so the reason is visible (subtitle below).
  const locked = positions.some(
    p => p.position.coin.toUpperCase() === coin.toUpperCase()
  )

  // Local draft so a selection doesn't hit the exchange until Done.
  const [draftMode, setDraftMode] = useState<MarginMode>(marginMode)

  // Seed from HL's authoritative per-coin mode once it loads. The shared
  // context ALWAYS mirrors HL (otherwise a tap made before the data resolved
  // would leave it on the unseeded default — wrong Place Order row, redundant
  // or skipped commits); only the local draft is protected once the user has
  // picked an option, so we never fight an edit.
  const userTouchedRef = useRef(false)
  useEffect(() => {
    if (leverageType === undefined) {
      return
    }
    const mode = onlyIsolated ? 'isolated' : leverageType
    setMarginMode(mode)
    if (!userTouchedRef.current) {
      setDraftMode(mode)
    }
  }, [leverageType, onlyIsolated, setMarginMode])

  const selectMode = useCallback((mode: MarginMode) => {
    userTouchedRef.current = true
    setDraftMode(mode)
  }, [])

  // Margin mode is the `isCross` flag of HL's per-coin leverage setting (there
  // is no standalone action), so committing re-pushes the current leverage
  // with the new flag.
  const handleConfirm = useCallback(async () => {
    if (locked || draftMode === marginMode) {
      router.back()
      return
    }
    const ok = await updateLeverage(
      coin,
      leverage,
      draftMode === 'cross',
      'Margin mode updated'
    )
    if (!ok) {
      return
    }
    setMarginMode(draftMode)
    router.back()
  }, [
    locked,
    draftMode,
    marginMode,
    updateLeverage,
    coin,
    leverage,
    setMarginMode,
    router
  ])

  const renderFooter = useCallback(
    () => (
      <Button
        type="primary"
        size="large"
        testID="perpetuals_margin_mode_done"
        // Gate on the per-coin data (seeds draftMode) AND on the context
        // leverage: the latter is seeded by the index screen one render after
        // the same query resolves, so without it Done could push leverage 0
        // (also covers direct navigation that skips the index screen).
        disabled={busy || leverageType === undefined || leverage <= 0}
        onPress={handleConfirm}>
        Done
      </Button>
    ),
    [busy, leverageType, leverage, handleConfirm]
  )

  const renderAccessory = useCallback(
    (mode: MarginMode) => {
      return (
        <View sx={{ width: 24, height: 24, marginRight: 16 }}>
          {mode === draftMode ? (
            <Icons.Navigation.Check color={theme.colors.$textPrimary} />
          ) : null}
        </View>
      )
    },
    [draftMode, theme.colors.$textPrimary]
  )

  const data = useMemo(() => {
    const crossDisabled = locked || onlyIsolated
    const isolatedDisabled = locked

    return [
      {
        title: 'Cross',
        subtitle:
          'All cross positions share the same cross margin as collateral. In the event of liquidation, your cross margin balance and any remaining open positions under assets in this mode may be forfeited.',
        accessory: renderAccessory('cross'),
        onPress: crossDisabled ? undefined : () => selectMode('cross'),
        containerSx: crossDisabled ? { opacity: 0.4 } : undefined
      },
      {
        title: 'Isolated',
        subtitle:
          'Manage your risk on individual positions by restricting the amount of margin allocated to each. If the margin ratio of an isolated position reaches 100%, the position will be liquidated. Margin can be added or removed to individual positions in this mode.',
        accessory: renderAccessory('isolated'),
        onPress: isolatedDisabled ? undefined : () => selectMode('isolated'),
        containerSx: isolatedDisabled ? { opacity: 0.4 } : undefined
      }
    ]
  }, [locked, onlyIsolated, renderAccessory, selectMode])

  return (
    <ScrollScreen
      isModal
      title="Margin mode"
      subtitle={
        locked
          ? 'Close your open position to change margin mode for this market'
          : 'Select which mode to use for your margin'
      }
      renderFooter={renderFooter}
      contentContainerStyle={{ padding: 16 }}>
      <GroupList
        subtitleVariant="subtitle2"
        data={data}
        subtitleSx={{
          marginRight: 60
        }}
        style={{
          marginTop: 8
        }}
      />
    </ScrollScreen>
  )
}
