import React, { FC } from 'react'
import { Icons, useTheme, View } from '@avalabs/k2-alpine'
import { NetworkBadge } from 'common/components/NetworkBadge'
import { AnimatedSyncIcon } from 'common/components/AnimatedSyncIcon'
import { NotificationSwapStatus } from '../types'

const ICON_SIZE = 36

type SwapIconProps = {
  status: NotificationSwapStatus
  networkLogoUri?: string
}

/**
 * Icon shown on the left of each swap item:
 *  - completed  → grey circle with Compare arrows (→←) + optional network badge
 *  - failed     → grey circle with Compare arrows (→←) + optional network badge
 *  - in_progress → grey circle with a continuously spinning sync icon + optional network badge
 */
export const SwapIcon: FC<SwapIconProps> = ({ status, networkLogoUri }) => {
  const {
    theme: { colors }
  } = useTheme()

  if (status === 'completed' || status === 'failed') {
    return (
      <View sx={{ width: ICON_SIZE }}>
        <View
          sx={{
            width: ICON_SIZE,
            height: ICON_SIZE,
            borderRadius: ICON_SIZE / 2,
            backgroundColor: '$surfaceSecondary',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
          <Icons.Custom.Compare color={colors.$textPrimary} />
        </View>
        {networkLogoUri && (
          <NetworkBadge
            logoUri={networkLogoUri}
            borderColor={colors.$surfacePrimary}
          />
        )}
      </View>
    )
  }

  return (
    <View sx={{ width: ICON_SIZE }}>
      <View
        sx={{
          width: ICON_SIZE,
          height: ICON_SIZE,
          borderRadius: ICON_SIZE / 2,
          backgroundColor: '$surfaceSecondary',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
        <AnimatedSyncIcon size={ICON_SIZE * 0.65} />
      </View>
    </View>
  )
}
