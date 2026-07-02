import React, { useCallback, useEffect, useState } from 'react'
import { LayoutChangeEvent, TouchableOpacity } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'
import {
  Button,
  Icons,
  Separator,
  Text,
  View,
  useTheme
} from '@avalabs/k2-alpine'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { useSelector } from 'react-redux'
import { selectIsFusionAvalancheCctEnabled } from 'store/posthog'
import { useStuckAtomicFunds } from '../hooks/useStuckAtomicFunds'
import {
  stuckRouteKey,
  useStuckFundsRecovery
} from '../hooks/useStuckFundsRecovery'
import { useIsFusionServiceReady } from '../hooks/useZustandStore'
import { routeLabel } from '../utils/stuckFundsRoutes'

// Atomic AVAX amounts are denominated in nAVAX (9 decimals).
const NAVAX_DECIMALS = 9

// Expand/collapse timing, matched to the wallets screen's WalletCard so the
// motion feels consistent across the app.
const EXPAND_TIMING = {
  duration: 300,
  easing: Easing.bezier(0.25, 1, 0.5, 1)
}

// Title / amount rows: Inter Regular 16 / 22 per Figma. No k2-alpine variant
// encodes 16/22 exactly, so we anchor on `body1` (Inter Regular, primary color)
// for the font family/weight and override only the two differing dimensions.
const TITLE_TEXT_SX = { fontSize: 16, lineHeight: 22 } as const

const formatAvax = (amountNAvax: bigint): string =>
  `${new TokenUnit(amountNAvax, NAVAX_DECIMALS, 'AVAX').toDisplay()} AVAX`

/**
 * Shared banner surfacing AVAX stranded in atomic memory after an incomplete
 * cross-chain transfer. Collapsed by default; expands to one row per stranded
 * route, each with a Recover action that builds an import-only recovery quote
 * and broadcasts it directly (via useStuckFundsRecovery), surfacing the standard
 * CCT approval — no swap-screen detour, matching core-web's Recover UX.
 *
 * Renders nothing (and reserves no space) when there are no stranded funds, so
 * callers should NOT wrap it in a spacing container — pass margins via `sx`
 * instead, which apply only when the banner actually renders.
 */
export const StuckFundsBanner = ({
  sx
}: {
  sx?: React.ComponentProps<typeof View>['sx']
} = {}): JSX.Element | null => {
  const { theme } = useTheme()
  const isAvalancheCctEnabled = useSelector(selectIsFusionAvalancheCctEnabled)
  const { routes, totalNAvax, hasAnyAtomics } = useStuckAtomicFunds()
  const { recover, recoveringKey } = useStuckFundsRecovery()
  const [isFusionServiceReady] = useIsFusionServiceReady()
  const [expanded, setExpanded] = useState(false)

  // Natural height of the rows, measured off an absolutely-positioned layer so
  // it's the intrinsic content height regardless of the animated wrapper's
  // clipped height. Kept in a shared value so it drives the animation on the UI
  // thread. Measured up front (rows always rendered) so the first open animates.
  const contentHeight = useSharedValue(0)
  // 0 = collapsed, 1 = expanded — the only time-animated value.
  const expandProgress = useSharedValue(0)

  const onContentLayout = useCallback(
    (event: LayoutChangeEvent): void => {
      contentHeight.value = event.nativeEvent.layout.height
    },
    [contentHeight]
  )

  useEffect(() => {
    expandProgress.value = withTiming(expanded ? 1 : 0, EXPAND_TIMING)
  }, [expanded, expandProgress])

  // Wrapper height animates between 0 and the measured content height; overflow
  // is clipped so the rows are revealed/hidden as it grows/shrinks.
  const animatedContentStyle = useAnimatedStyle(() => ({
    height: expandProgress.value * contentHeight.value
  }))

  const animatedChevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${expandProgress.value * 180}deg` }]
  }))

  // Gate on the CCT flag (recovery relies on CCT deps that aren't wired when the
  // flag is off) and hide until Fusion is ready, so Recover is never shown in an
  // unusable state. Detection is already flag-gated, so this is defense-in-depth.
  const isHidden =
    !isAvalancheCctEnabled || !hasAnyAtomics || !isFusionServiceReady

  // Collapse when hidden so the banner re-shows collapsed (e.g. after a recovery
  // clears the routes) — React keeps the component mounted when it returns null.
  useEffect(() => {
    if (isHidden && expanded) {
      setExpanded(false)
    }
  }, [isHidden, expanded])

  if (isHidden) {
    return null
  }

  const plural = routes.length > 1 ? 's' : ''

  return (
    <View
      testID="stuckFundsBanner"
      sx={{
        backgroundColor: '$surfaceSecondary',
        borderRadius: 12,
        paddingHorizontal: 16,
        ...sx
      }}>
      <TouchableOpacity
        testID="stuckFundsBanner_toggle"
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={() => setExpanded(prev => !prev)}>
        <View
          sx={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            paddingVertical: 14
          }}>
          <View sx={{ flex: 1 }}>
            <Text variant="body1" sx={TITLE_TEXT_SX}>
              Core has detected stuck funds
            </Text>
            <Text variant="subtitle2" sx={{ color: '$textSecondary' }}>
              {`You have ${formatAvax(
                totalNAvax
              )} stuck in atomic memory from incomplete cross-chain transfer${plural}`}
            </Text>
          </View>
          <Animated.View style={animatedChevronStyle}>
            <Icons.Navigation.ExpandMore color={theme.colors.$textSecondary} />
          </Animated.View>
        </View>
      </TouchableOpacity>

      <Animated.View
        pointerEvents={expanded ? 'auto' : 'none'}
        style={[animatedContentStyle, { overflow: 'hidden' }]}>
        {/* Absolutely positioned so onLayout reports the intrinsic row height,
            independent of the wrapper's animated (clipped) height. */}
        <View
          onLayout={onContentLayout}
          style={{ position: 'absolute', left: 0, right: 0, top: 0 }}>
          {routes.map(route => {
            const key = stuckRouteKey(route)
            const isRecovering = recoveringKey === key
            return (
              <View key={key}>
                {/* Flush divider above every row, including the first (separates
                    it from the header), per Figma's menu-row borders. */}
                <Separator />
                <View
                  sx={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 14,
                    gap: 8
                  }}>
                  <View sx={{ flex: 1 }}>
                    <Text variant="body1" sx={TITLE_TEXT_SX}>
                      {formatAvax(route.amountNAvax)}
                    </Text>
                    <Text variant="subtitle2" sx={{ color: '$textSecondary' }}>
                      {routeLabel(route.source, route.dest)}
                    </Text>
                  </View>
                  <Button
                    testID={`stuckFundsBanner_recover_${route.source}_${route.dest}`}
                    type="secondary"
                    size="small"
                    disabled={recoveringKey !== null}
                    onPress={() => recover(route)}>
                    {isRecovering ? 'Recovering' : 'Recover'}
                  </Button>
                </View>
              </View>
            )
          })}
        </View>
      </Animated.View>
    </View>
  )
}
