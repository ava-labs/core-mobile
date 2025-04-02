import React from 'react'
import { View } from 'react-native'
import AvaText from 'components/AvaText'
import CoreLogo from '../assets/icons/core.svg'

export default function LogoLoader(): JSX.Element {
  return (
    <View
      style={{
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center'
      }}>
      <CoreLogo height={100} />
      <AvaText.Heading3>Unlocking wallet...</AvaText.Heading3>
    </View>
  )
}
