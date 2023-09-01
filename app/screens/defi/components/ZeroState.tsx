import React from 'react'
import { View } from 'react-native'
import AvaText from 'components/AvaText'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Space } from 'components/Space'
import AvaButton from 'components/AvaButton'
import LinkSVG from 'components/svg/LinkSVG'

export const ZeroState = ({
  onExploreEcosystem
}: {
  onExploreEcosystem?: () => void
}) => {
  const { theme } = useApplicationContext()

  return (
    <View style={{ marginHorizontal: 39, alignItems: 'center' }}>
      <View style={{ alignItems: 'center' }}>
        <Space y={96} />
        <View style={{ alignItems: 'center' }}>
          <AvaText.Heading5>No DeFi Transactions</AvaText.Heading5>
          <Space y={8} />
          <AvaText.Body2 textStyle={{ textAlign: 'center', lineHeight: 20 }}>
            {'Discover top dApps on Avalanche now.'}
          </AvaText.Body2>
        </View>
      </View>
      <Space y={24} />
      <AvaButton.PrimaryLarge onPress={onExploreEcosystem}>
        <LinkSVG color={theme.logoColor} />
        <Space x={8} />
        Explore Ecosystem
      </AvaButton.PrimaryLarge>
    </View>
  )
}
