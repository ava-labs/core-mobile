import React, { FC } from 'react'
import { View } from '@avalabs/k2-alpine'
import { NetworkLogo } from 'common/components/NetworkLogo'

const BADGE_SIZE = 16
const BADGE_BORDER_WIDTH = 2
const BADGE_OFFSET = 6

type NetworkBadgeProps = {
  logoUri: string
  borderColor: string
}

/**
 * A small circular network logo pinned to the bottom-right corner of a
 * parent element (which must have `position: 'relative'` or equivalent).
 *
 * Default dimensions: 16 px logo, 2 px border, −6 px offset.
 */
export const NetworkBadge: FC<NetworkBadgeProps> = ({ logoUri, borderColor }) => {
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
        bottom: -BADGE_OFFSET,
        right: -BADGE_OFFSET,
        backgroundColor: 'transparent',
        overflow: 'hidden'
      }}>
      <NetworkLogo logoUri={logoUri} size={BADGE_SIZE} />
    </View>
  )
}
