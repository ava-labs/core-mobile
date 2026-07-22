import { Button, GroupList, Icons, useTheme, View } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useRouter } from 'expo-router'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { usePlaceOrder, type MarginMode } from '../contexts/PlaceOrderContext'
import { useHyperliquidMarketContext } from '../hooks/useHyperliquidMarketContext'
import { usePerpsActiveAssetData } from '../hooks/usePerpsActiveAssetData'
import { usePerpsPositionActions } from '../hooks/usePerpsPositionActions'
import { usePerpsPositions } from '../hooks/usePerpsPositions'

const CROSS_DESCRIPTION =
  'All cross positions share the same cross margin as collateral. In the event of liquidation, your cross margin balance and any remaining open positions under assets in this mode may be forfeited.'

const ISOLATED_DESCRIPTION =
  'Manage your risk on individual positions by restricting the amount of margin allocated to each. If the margin ratio of an isolated position reaches 100%, the position will be liquidated. Margin can be added or removed to individual positions in this mode.'

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

  // Seed from HL's authoritative per-coin mode once it loads, but only before
  // the user picks an option (so we never fight an edit) — mirrors the
  // leverage seeding on PerpetualsLeverageScreen.
  const userTouchedRef = useRef(false)
  useEffect(() => {
    if (userTouchedRef.current || leverageType === undefined) {
      return
    }
    const mode = onlyIsolated ? 'isolated' : leverageType
    setDraftMode(mode)
    setMarginMode(mode)
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
        // leverageType and leverage both come from the same activeAssetData
        // query, so gating on it guarantees leverage/draftMode are seeded
        // before a commit can fire (otherwise Done could push leverage 0).
        disabled={busy || leverageType === undefined}
        onPress={handleConfirm}>
        Done
      </Button>
    ),
    [busy, leverageType, handleConfirm]
  )

  const checkmark = <Icons.Navigation.Check color={theme.colors.$textPrimary} />
  // Keeps row text width stable between selected/unselected states.
  const accessoryPlaceholder = <View sx={{ width: 24, height: 24 }} />

  const crossDisabled = locked || onlyIsolated
  const isolatedDisabled = locked

  return (
    <ScrollScreen
      isModal
      title="Margin mode"
      subtitle={
        locked
          ? 'Close your open position to change margin mode for this market'
          : 'Select which mode to use for your margin'
      }
      navigationTitle="Margin mode"
      renderFooter={renderFooter}
      contentContainerStyle={{ padding: 16 }}>
      <View sx={{ paddingTop: 8 }}>
        <GroupList
          subtitleVariant="caption"
          data={[
            {
              title: 'Cross',
              subtitle: CROSS_DESCRIPTION,
              accessory:
                draftMode === 'cross' ? checkmark : accessoryPlaceholder,
              onPress: crossDisabled ? undefined : () => selectMode('cross'),
              containerSx: crossDisabled ? { opacity: 0.4 } : undefined
            },
            {
              title: 'Isolated',
              subtitle: ISOLATED_DESCRIPTION,
              accessory:
                draftMode === 'isolated' ? checkmark : accessoryPlaceholder,
              onPress: isolatedDisabled
                ? undefined
                : () => selectMode('isolated'),
              containerSx: isolatedDisabled ? { opacity: 0.4 } : undefined
            }
          ]}
        />
      </View>
    </ScrollScreen>
  )
}
