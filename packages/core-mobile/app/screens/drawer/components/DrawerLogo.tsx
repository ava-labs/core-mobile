import React from 'react'
import CoreLogo from 'assets/icons/core.svg'
import { View } from 'react-native'

const DrawerLogo = (): React.JSX.Element => {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
      <CoreLogo />
    </View>
  )
}

export default DrawerLogo
