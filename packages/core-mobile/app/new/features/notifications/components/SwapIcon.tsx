import React, { FC } from 'react'
import { Icons, useTheme, View } from '@avalabs/k2-alpine'
import { NetworkLogo } from 'common/components/NetworkLogo'
import { AnimatedSyncIcon } from 'common/components/AnimatedSyncIcon'
import { NotificationSwapStatus } from '../types'

const ICON_SIZE = 32
const BADGE_SIZE = 10
const BADGE_BORDER_WIDTH = 2

type SwapIconProps = {
  status: NotificationSwapStatus
  networkLogoUri?: string
}

const NetworkBadge: FC<{ networkLogoUri: string; borderColor: string }> = ({
  networkLogoUri,
  borderColor
}) => {
  const badgeContainerSize = BADGE_SIZE + BADGE_BORDER_WIDTH * 2
  return (
    <View
      sx={{
        width: badgeContainerSize,
        height: badgeContainerSize,
        borderRadius: badgeContainerSize / 2,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: BADGE_BORDER_WIDTH,
        borderColor,
        position: 'absolute',
        bottom: -BADGE_BORDER_WIDTH,
        right: -BADGE_BORDER_WIDTH,
        backgroundColor: 'transparent',
        overflow: 'hidden'
      }}>
      <NetworkLogo logoUri={networkLogoUri} size={BADGE_SIZE} />
    </View>
  )
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
          <Icons.Custom.Compare
            color={colors.$textPrimary}
            width={ICON_SIZE / 2}
            height={ICON_SIZE / 2}
          />
        </View>
        {networkLogoUri && (
          <NetworkBadge
            networkLogoUri={networkLogoUri}
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
