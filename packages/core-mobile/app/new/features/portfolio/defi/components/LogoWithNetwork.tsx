import React from 'react'
import { Image, useTheme, View } from '@avalabs/k2-alpine'
import {
  DeFiChain,
  DeFiProtocol,
  DeFiSimpleProtocol
} from 'services/defi/types'

export const LogoWithNetwork = ({
  item,
  chain,
  size
}: {
  item: DeFiSimpleProtocol | DeFiProtocol
  chain: DeFiChain | undefined
  size: 'large' | 'medium' | 'small'
}): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const borderColor = colors.$surfaceSecondary

  const networkLogo = chain?.logoUrl

  const width = size === 'large' ? 62 : size === 'medium' ? 42 : 36
  const networkLogoInset = size === 'large' ? -2 : -4

  return (
    <View sx={{ width: width, height: width }}>
      <Image
        source={{ uri: item.logoUrl }}
        style={{
          width: width,
          height: width,
          borderRadius: width / 2
        }}
        testID="protocol_logo"
      />
      <Image
        source={{ uri: networkLogo }}
        style={{
          width: 18,
          height: 18,
          borderRadius: 18 / 2,
          position: 'absolute',
          bottom: networkLogoInset,
          right: networkLogoInset,
          borderColor,
          borderWidth: 2
        }}
        testID="network_logo"
      />
    </View>
  )
}
