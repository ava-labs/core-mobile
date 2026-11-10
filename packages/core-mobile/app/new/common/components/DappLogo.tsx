import React from 'react'
import { View, Logos } from '@avalabs/k2-alpine'
import { PeerMeta } from 'store/rpc/types'
import { useSelector } from 'react-redux'
import { selectSelectedColorScheme } from 'store/settings/appearance/slice'
import { TokenLogo } from './TokenLogo'

export const DappLogo = ({
  peerMeta,
  size = 62,
  trusted = false
}: {
  peerMeta: PeerMeta
  size?: number
  /**
   * Whether the peer's identity has been verified (e.g. WC Verify attested Core
   * domain). The first-party Core logo is rendered ONLY when this is true —
   * `peerMeta.name` is attacker-controlled, so keying the official logo off the
   * name alone lets any dApp masquerade as Core by naming itself "Core".
   */
  trusted?: boolean
}): JSX.Element => {
  const selectedColorScheme = useSelector(selectSelectedColorScheme)

  if (trusted && peerMeta.name === 'Core') {
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
