import React from 'react'
import { StyleSheet, View } from 'react-native'
import AvaText from 'components/AvaText'
import AvaLogoSVG from 'components/svg/AvaLogoSVG'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Space } from 'components/Space'
import { Row } from 'components/Row'
import EarnSVG from 'components/svg/EarnSVG'
import Separator from 'components/Separator'
import CalendarSVG from 'components/svg/CalendarSVG'
import Globe2SVG from 'components/svg/Globe2SVG'
import AvaButton from 'components/AvaButton'
import FlexSpacer from 'components/FlexSpacer'

export default function GetStarted() {
  const { theme } = useApplicationContext()

  return (
    <View style={{ padding: 16, flex: 1 }}>
      <AvaText.LargeTitleBold>Get Started</AvaText.LargeTitleBold>
      <View style={{ alignItems: 'center' }}>
        <Space y={47} />
        <AvaLogoSVG
          size={56}
          backgroundColor={theme.tokenLogoBg}
          logoColor={theme.tokenLogoColor}
        />
        <Space y={16} />
        <View style={{ paddingHorizontal: 23 }}>
          <AvaText.Heading5>Earn rewards through staking</AvaText.Heading5>
          <AvaText.Body2>
            {
              'Stake your AVAX in the Avalanche Network and earn rewards up to 9% APY. \n\nLearn more about staking here.'
            }
          </AvaText.Body2>
        </View>
      </View>
      <Space y={40} />
      <Row style={{ alignItems: 'center' }}>
        <View style={[styles.circular, { backgroundColor: theme.colorBg2 }]}>
          <EarnSVG selected={true} />
        </View>
        <Space x={16} />
        <AvaText.Heading6>Earn yield on your AVAX tokens.</AvaText.Heading6>
      </Row>
      <Separator style={{ marginLeft: 64, marginVertical: 14 }} />
      <Row style={{ alignItems: 'center' }}>
        <View style={[styles.circular, { backgroundColor: theme.colorBg2 }]}>
          <CalendarSVG selected={true} />
        </View>
        <Space x={16} />
        <AvaText.Heading6>Choose your desired timeline.</AvaText.Heading6>
      </Row>
      <Separator style={{ marginLeft: 64, marginVertical: 14 }} />
      <Row style={{ alignItems: 'center' }}>
        <View style={[styles.circular, { backgroundColor: theme.colorBg2 }]}>
          <Globe2SVG />
        </View>
        <Space x={16} />
        <AvaText.Heading6>Secure the Avalanche network.</AvaText.Heading6>
      </Row>
      <FlexSpacer />
      <AvaButton.PrimaryLarge>Next</AvaButton.PrimaryLarge>
    </View>
  )
}

const styles = StyleSheet.create({
  circular: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 48,
    overflow: 'hidden'
  }
})
