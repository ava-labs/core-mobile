import React from 'react'
import { Linking, Pressable, StyleSheet, View } from 'react-native'
import AvaText from 'components/AvaText'
import AvaLogoSVG from 'components/svg/AvaLogoSVG'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Space } from 'components/Space'
import { Row } from 'components/Row'
import Separator from 'components/Separator'
import Calendar2SVG from 'components/svg/Calendar2SVG'
import Globe2SVG from 'components/svg/Globe2SVG'
import AvaButton from 'components/AvaButton'
import { DOCS_STAKING } from 'resources/Constants'
import Logger from 'utils/Logger'
import CircularPlusSVG from 'components/svg/CircularPlusSVG'
import { StakeSetupScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation } from '@react-navigation/core'
import { ScrollView } from 'react-native-gesture-handler'

type ScreenProps = StakeSetupScreenProps<
  typeof AppNavigation.StakeSetup.GetStarted
>['navigation']

export default function GetStarted({ onNext }: { onNext: () => void }) {
  const { theme } = useApplicationContext()
  const { navigate } = useNavigation<ScreenProps>()

  function goToStakingDocs() {
    Linking.openURL(DOCS_STAKING).catch(e => {
      Logger.error(DOCS_STAKING, e)
    })
  }

  const goToDisclaimer = () => {
    navigate(AppNavigation.Modal.StakeDisclaimer)
  }

  return (
    <ScrollView
      contentContainerStyle={{
        paddingHorizontal: 16
      }}>
      <AvaText.LargeTitleBold>Get Started</AvaText.LargeTitleBold>
      <Space y={31} />
      <View style={{ alignItems: 'center' }}>
        <AvaLogoSVG
          size={56}
          backgroundColor={theme.tokenLogoBg}
          logoColor={theme.tokenLogoColor}
        />
        <Space y={16} />
        <View style={{ paddingHorizontal: 23, alignItems: 'center' }}>
          <AvaText.Heading5>Stake your AVAX, get rewards</AvaText.Heading5>
          <Space y={8} />
          <AvaText.Body2 textStyle={{ textAlign: 'center' }}>
            {
              'Use Core to delegate your AVAX to nodes in the Avalanche network and receive rewards.'
            }
          </AvaText.Body2>
          <Row
            style={{
              alignItems: 'center'
            }}>
            <AvaText.Body2>
              {' Learn more about how staking works '}
            </AvaText.Body2>
            <AvaButton.TextLink
              onPress={goToStakingDocs}
              textColor={theme.colorPrimary1}
              style={{
                paddingHorizontal: 0
              }}>
              here
            </AvaButton.TextLink>
            <AvaText.Body2>{'.'}</AvaText.Body2>
          </Row>
        </View>
      </View>
      <Space y={40} />
      <Row style={{ alignItems: 'center' }}>
        <View style={[styles.circular, { backgroundColor: theme.colorBg2 }]}>
          <Calendar2SVG />
        </View>
        <Space x={16} />
        <View style={{ flex: 1 }}>
          <AvaText.Heading6>Choose your desired timeline</AvaText.Heading6>
        </View>
      </Row>
      <Separator style={{ marginLeft: 64, marginVertical: 14 }} />
      <Row style={{ alignItems: 'center' }}>
        <View style={[styles.circular, { backgroundColor: theme.colorBg2 }]}>
          <Globe2SVG />
        </View>
        <Space x={16} />
        <View style={{ flex: 1 }}>
          <AvaText.Heading6>Secure the Avalanche network</AvaText.Heading6>
        </View>
      </Row>
      <Separator style={{ marginLeft: 64, marginVertical: 14 }} />
      <Row style={{ alignItems: 'center' }}>
        <View style={[styles.circular, { backgroundColor: theme.colorBg2 }]}>
          <CircularPlusSVG />
        </View>
        <Space x={16} />
        <View style={{ flex: 1 }}>
          <AvaText.Heading6>Receive your staking rewards</AvaText.Heading6>
        </View>
      </Row>
      <Space y={40} />
      <AvaButton.PrimaryLarge onPress={onNext}>Next</AvaButton.PrimaryLarge>
      <Space y={16} />
      <Pressable
        style={{ marginHorizontal: 16, marginBottom: 32 }}
        onPress={goToDisclaimer}
        accessibilityRole="button">
        <AvaText.Overline textStyle={{ textAlign: 'center' }}>
          <AvaText.TextLink
            textStyle={{ fontSize: 10, lineHeight: 16 }}
            onPress={goToDisclaimer}
            accessible={true}>
            Disclaimer
          </AvaText.TextLink>
          : Delegating is a feature of Avalanche's staking mechanism that allows
          token holders to participate...
        </AvaText.Overline>
      </Pressable>
    </ScrollView>
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
