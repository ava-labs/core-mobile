import React from 'react'
import { Button, Icons, Text, View, useTheme } from '@avalabs/k2-alpine'
import { useGetClaimableBalance } from 'hooks/earn/useGetClaimableBalance'
import { useDispatch, useSelector } from 'react-redux'
import { selectIsFusionAvalancheCctEnabled } from 'store/posthog'
import {
  ViewOnceKey,
  selectHasBeenViewedOnce,
  setViewOnce
} from 'store/viewOnce'

// Same claimable threshold as the Claim card (see StakesScreen): amounts at or
// below roughly the claim tx fee aren't worth moving.
const CLAIMABLE_THRESHOLD_AVAX = 0.05

/**
 * Dismissible banner (CP-14656) telling stakers that AVAX is moved from
 * P-Chain back to C-Chain via the Swap feature (Avalanche CCT). Shows while
 * the user has a claimable P-Chain balance; "Got it" hides it permanently.
 *
 * Renders nothing (and reserves no space) when hidden, so callers should NOT
 * wrap it in a spacing container — pass margins via `sx` instead.
 */
export const CctBanner = ({
  sx
}: {
  sx?: React.ComponentProps<typeof View>['sx']
} = {}): JSX.Element | null => {
  const { theme } = useTheme()
  const dispatch = useDispatch()
  const isAvalancheCctEnabled = useSelector(selectIsFusionAvalancheCctEnabled)
  const hasBeenDismissed = useSelector(
    selectHasBeenViewedOnce(ViewOnceKey.CCT_BANNER)
  )
  const claimableInAvax = useGetClaimableBalance()

  if (
    !isAvalancheCctEnabled ||
    hasBeenDismissed ||
    claimableInAvax?.gt(CLAIMABLE_THRESHOLD_AVAX) !== true
  ) {
    return null
  }

  return (
    <View
      testID="cctBanner"
      sx={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        ...sx
      }}>
      <Icons.Action.Info color={theme.colors.$textPrimary} />
      <Text variant="body1" sx={{ flex: 1, lineHeight: 20 }}>
        To transfer AVAX from P-Chain to C-Chain, use the Swap feature.
      </Text>
      <Button
        testID="cctBanner_gotIt"
        type="secondary"
        size="small"
        onPress={() => dispatch(setViewOnce(ViewOnceKey.CCT_BANNER))}>
        Got it
      </Button>
    </View>
  )
}
