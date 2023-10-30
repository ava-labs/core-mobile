import React from 'react'
import OwlSVG from 'components/svg/OwlSVG'
import CoreTextSVG from 'components/svg/CoreTextSVG'
import { View } from 'react-native'
import { Space } from 'components/Space'

const DrawerLogo = () => {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
      <OwlSVG />
      <Space x={20} />
      <CoreTextSVG />
    </View>
  )
}

export default DrawerLogo
