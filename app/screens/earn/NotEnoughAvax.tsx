import React from 'react'
import { Linking, View } from 'react-native'
import AvaText from 'components/AvaText'
import AvaLogoSVG from 'components/svg/AvaLogoSVG'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Space } from 'components/Space'
import { Row } from 'components/Row'
import AvaButton from 'components/AvaButton'
import FlexSpacer from 'components/FlexSpacer'
import { DOCS_STAKING } from 'resources/Constants'
import Logger from 'utils/Logger'

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

  function goToStakingDocs() {
    Linking.openURL(DOCS_STAKING).catch(e => {
      Logger.error(DOCS_STAKING, e)
    })
  }

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
            {
              'Buy or Swap AVAX to begin staking. Staking your AVAX in the Avalanche Network allows you to earn up to 10% APY.\n'
            }
          </AvaText.Body2>
          <Row
            style={{
              alignItems: 'center'
            }}>
            <AvaText.Body2>{'Not sure where to begin? '}</AvaText.Body2>
            <AvaButton.TextLink
              onPress={goToStakingDocs}
              textColor={theme.colorPrimary1}
              style={{
                paddingHorizontal: 0
              }}>
              Read more.
            </AvaButton.TextLink>
          </Row>
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
