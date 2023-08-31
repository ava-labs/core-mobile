import React from 'react'
import { View } from 'react-native'
import AvaText from 'components/AvaText'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Space } from 'components/Space'
import InfoSVG from 'components/svg/InfoSVG'

export const ErrorState = () => {
  const { theme } = useApplicationContext()

  return (
    <View style={{ marginHorizontal: 39 }}>
      <View style={{ alignItems: 'center' }}>
        <Space y={96} />
        <InfoSVG size={56} color={theme.white} />
        <Space y={24} />
        <View style={{ alignItems: 'center' }}>
          <AvaText.Heading5>Data Unavailable!</AvaText.Heading5>
          <Space y={8} />
          <AvaText.Body2 textStyle={{ textAlign: 'center', lineHeight: 20 }}>
            {'Data currently unavailable, check back later.'}
          </AvaText.Body2>
        </View>
      </View>
    </View>
  )
}
