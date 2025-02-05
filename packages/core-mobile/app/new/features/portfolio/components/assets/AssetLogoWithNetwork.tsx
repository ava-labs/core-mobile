import React from 'react'

import { useTheme, View } from '@avalabs/k2-alpine'
import { ProtocolLogo } from 'screens/defi/components/ProtocolLogo'
import { NetworkLogo } from 'screens/defi/components/NetworkLogo'

interface Props {
  logoUrl: string
  networkLogo?: string
}

export const AssetLogoWithNetwork = ({
  logoUrl,
  networkLogo
}: Props): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  return (
    <View style={{ marginRight: 16 }}>
      <ProtocolLogo uri={logoUrl} />
      <NetworkLogo
        uri={networkLogo}
        size={16}
        style={{
          position: 'absolute',
          bottom: -2,
          right: -2,
          borderColor: colors.$surfacePrimary,
          borderWidth: 2
        }}
      />
    </View>
  )
}
