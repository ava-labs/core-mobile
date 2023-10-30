import React from 'react'
import { View } from 'react-native'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import InfoSVG from 'components/svg/InfoSVG'
import { useApplicationContext } from 'contexts/ApplicationContext'

export const EmptyClaimRewards = () => {
  const { theme } = useApplicationContext()

  return (
    <View style={{ padding: 16, flex: 1 }}>
      <View style={{ flex: 1, alignItems: 'center' }}>
        <Space y={80} />
        <InfoSVG size={56} color={theme.white} />
        <Space y={24} />
        <AvaText.Heading5>No Claimable Balance</AvaText.Heading5>
      </View>
    </View>
  )
}
