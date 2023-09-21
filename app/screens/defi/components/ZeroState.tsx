import React from 'react'
import { StyleProp, View, ViewStyle } from 'react-native'
import AvaText from 'components/AvaText'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Space } from 'components/Space'
import AvaButton from 'components/AvaButton'
import LinkSVG from 'components/svg/LinkSVG'

export const ZeroState = ({
  onExploreEcosystem,
  bodyText,
  styles
}: {
  onExploreEcosystem?: () => void
  bodyText?: string
  styles?: StyleProp<ViewStyle>
}) => {
  const { theme } = useApplicationContext()

  return (
    <View style={[{ alignItems: 'center' }, styles]}>
      <View style={{ alignItems: 'center' }}>
        <View style={{ alignItems: 'center' }}>
          <AvaText.Heading5>No DeFi Transactions</AvaText.Heading5>
          {bodyText && (
            <>
              <Space y={8} />
              <AvaText.Body2
                textStyle={{ textAlign: 'center', lineHeight: 20 }}>
                {bodyText}
              </AvaText.Body2>
            </>
          )}
        </View>
      </View>
      {!!onExploreEcosystem && (
        <>
          <Space y={24} />
          <AvaButton.PrimaryLarge onPress={onExploreEcosystem}>
            <LinkSVG color={theme.logoColor} />
            <Space x={8} />
            Explore Ecosystem
          </AvaButton.PrimaryLarge>
        </>
      )}
    </View>
  )
}
