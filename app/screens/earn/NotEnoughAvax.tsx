import React from 'react'
import { View } from 'react-native'
import AvaText from 'components/AvaText'
import AvaLogoSVG from 'components/svg/AvaLogoSVG'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Space } from 'components/Space'
import { Row } from 'components/Row'
import AvaButton from 'components/AvaButton'
import FlexSpacer from 'components/FlexSpacer'

export default function NotEnoughAvax({
  onBuyAvax,
  onSwap,
  onReceive
}: {
  onBuyAvax: () => void
  onSwap: () => void
  onReceive: () => void
}) {
  const { theme } = useApplicationContext()

  return (
    <View style={{ padding: 16, flex: 1 }}>
      <AvaText.LargeTitleBold>Stake</AvaText.LargeTitleBold>
      <View style={{ alignItems: 'center' }}>
        <Space y={47} />
        <AvaLogoSVG
          size={56}
          backgroundColor={theme.tokenLogoBg}
          logoColor={theme.tokenLogoColor}
        />
        <Space y={16} />
        <View style={{ paddingHorizontal: 23, alignItems: 'center' }}>
          <AvaText.Heading5>You don’t have enough AVAX!</AvaText.Heading5>
          <Space y={8} />
          <AvaText.Body2 textStyle={{ textAlign: 'center' }}>
            {'Buy or Swap AVAX to begin staking.'}
          </AvaText.Body2>
        </View>
      </View>
      <FlexSpacer />
      <Row>
        <AvaButton.SecondaryLarge
          onPress={onBuyAvax}
          style={{ flex: 1, marginRight: 16 }}>
          Buy AVAX
        </AvaButton.SecondaryLarge>
        <AvaButton.SecondaryLarge onPress={onSwap} style={{ flex: 1 }}>
          Swap AVAX
        </AvaButton.SecondaryLarge>
      </Row>
      <Space y={16} />
      <AvaButton.SecondaryLarge onPress={onReceive}>
        Receive AVAX
      </AvaButton.SecondaryLarge>
    </View>
  )
}
