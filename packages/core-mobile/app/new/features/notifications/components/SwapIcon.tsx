import React, { FC } from 'react'
import { Icons, useTheme, View } from '@avalabs/k2-alpine'
import { AnimatedSyncIcon } from 'common/components/AnimatedSyncIcon'
import { SwapStatus } from '../types'

const ICON_SIZE = 32

type SwapIconProps = {
  status: SwapStatus
}

/**
 * Icon shown on the left of each swap item:
 *  - completed  → static green circle with a white checkmark
 *  - failed     → static red circle with a white X icon
 *  - in_progress → grey circle with a continuously spinning sync icon
 */
export const SwapIcon: FC<SwapIconProps> = ({ status }) => {
  const {
    theme: { colors }
  } = useTheme()

  if (status === 'completed') {
    return (
      <View
        sx={{
          width: ICON_SIZE,
          height: ICON_SIZE,
          borderRadius: ICON_SIZE / 2,
          backgroundColor: '$textSuccess',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
        <Icons.Navigation.Check
          color={colors.$surfacePrimary}
          width={ICON_SIZE / 2}
          height={ICON_SIZE / 2}
        />
      </View>
    )
  }

  if (status === 'failed') {
    return (
      <View
        sx={{
          width: ICON_SIZE,
          height: ICON_SIZE,
          borderRadius: ICON_SIZE / 2,
          backgroundColor: '$textDanger',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
        <Icons.Content.Close
          color={colors.$surfacePrimary}
          width={ICON_SIZE / 2}
          height={ICON_SIZE / 2}
        />
      </View>
    )
  }

  return (
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
  )
}
