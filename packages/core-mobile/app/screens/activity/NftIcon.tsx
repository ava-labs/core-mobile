import React from 'react'
import { Image, View, useTheme } from '@avalabs/k2-mobile'

export const NftIcon = ({ nftUrl }: { nftUrl: string }): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  return (
    <View
      style={{
        height: 40,
        width: 40,
        borderRadius: 20,
        backgroundColor: colors.$neutral800,
        justifyContent: 'center',
        alignItems: 'center'
      }}>
      <Image
        source={{ uri: nftUrl }}
        style={{ height: 40, width: 40, borderRadius: 20 }}
      />
    </View>
  )
}
