import { Icons, useTheme, View } from '@avalabs/k2-alpine'
import React from 'react'
import { AnimatedEllipseIcon } from 'common/components/AnimatedEllipseIcon'
import { NotificationSwapStatus } from '../types'

const STATUS_ICON_SIZE = 20

export const StatusIcon = ({
  status
}: {
  status: NotificationSwapStatus
}): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()

  if (status === 'completed') {
    return (
      <View
        sx={{
          width: STATUS_ICON_SIZE,
          height: STATUS_ICON_SIZE,
          borderRadius: STATUS_ICON_SIZE / 2,
          backgroundColor: '$textSuccess',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
        <Icons.Navigation.Check
          color={colors.$surfacePrimary}
          width={STATUS_ICON_SIZE * 0.55}
          height={STATUS_ICON_SIZE * 0.55}
        />
      </View>
    )
  }

  if (status === 'failed') {
    return (
      <View
        sx={{
          width: STATUS_ICON_SIZE,
          height: STATUS_ICON_SIZE,
          borderRadius: STATUS_ICON_SIZE / 2,
          backgroundColor: '$textDanger',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
        <Icons.Content.Close
          color={colors.$surfacePrimary}
          width={STATUS_ICON_SIZE * 0.55}
          height={STATUS_ICON_SIZE * 0.55}
        />
      </View>
    )
  }

  return (
    <View
      sx={{
        width: STATUS_ICON_SIZE,
        height: STATUS_ICON_SIZE,
        borderRadius: STATUS_ICON_SIZE / 2,
        backgroundColor: '$surfaceSecondary',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
      <AnimatedEllipseIcon size={STATUS_ICON_SIZE * 0.65} />
    </View>
  )
}
