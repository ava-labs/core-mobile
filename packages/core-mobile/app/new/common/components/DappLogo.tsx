import React from 'react'
import { View, Logos } from '@avalabs/k2-alpine'
import { PeerMeta } from 'store/rpc/types'
import { useSelector } from 'react-redux'
import { selectSelectedColorScheme } from 'store/settings/appearance/slice'
import { TokenLogo } from './TokenLogo'

export const DappLogo = ({
  peerMeta,
  size = 62
}: {
  peerMeta: PeerMeta
  size?: number
}): JSX.Element => {
  const selectedColorScheme = useSelector(selectSelectedColorScheme)

  if (peerMeta.name === 'Core') {
    return (
      <View
        sx={{
          width: size,
          height: size,
          borderRadius: size / 2,
          overflow: 'hidden'
        }}>
        {selectedColorScheme === 'dark' ? (
          <Logos.AppIcons.CoreAppIconLight width={size} height={size} />
        ) : (
          <Logos.AppIcons.CoreAppIconDark width={size} height={size} />
        )}
      </View>
    )
  }

  const logoUri = peerMeta.icons[0]
  return <TokenLogo logoUri={logoUri} size={size} />
}
