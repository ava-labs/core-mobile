import React from 'react'
import { View } from 'react-native'
import AvaText from 'components/AvaText'
import CoreXLogoAnimated from 'components/CoreXLogoAnimated'

export default function OwlLoader(): JSX.Element {
  return (
    <View
      style={{
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center'
      }}>
      <CoreXLogoAnimated size={100} />
      <AvaText.Heading3>Unlocking wallet...</AvaText.Heading3>
    </View>
  )
}
