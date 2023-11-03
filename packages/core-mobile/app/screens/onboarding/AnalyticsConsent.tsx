import React, { FC } from 'react'
import FlexSpacer from 'components/FlexSpacer'
import AvaButton from 'components/AvaButton'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import { Linking, ScrollView } from 'react-native'
import AppNavigation from 'navigation/AppNavigation'
import { Row } from 'components/Row'
import CheckmarkSVG from 'components/svg/CheckmarkSVG'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { PRIVACY_POLICY_URL } from 'resources/Constants'
import { usePostCapture } from 'hooks/usePosthogCapture'
import { useDispatch } from 'react-redux'
import { setCoreAnalytics } from 'store/settings/securityPrivacy'

type Props = {
  nextScreen:
    | typeof AppNavigation.Onboard.CreateWalletStack
    | typeof AppNavigation.Onboard.EnterWithMnemonicStack
  onNextScreen: (
    screen:
      | typeof AppNavigation.Onboard.CreateWalletStack
      | typeof AppNavigation.Onboard.EnterWithMnemonicStack
  ) => void
}

const AnalyticsConsent: FC<Props> = ({ onNextScreen, nextScreen }: Props) => {
  const dispatch = useDispatch()
  const { theme } = useApplicationContext()
  const { capture } = usePostCapture()

  function openPrivacyPolicy(): void {
    Linking.openURL(PRIVACY_POLICY_URL)
  }

  function acceptAnalytics(): void {
    capture('OnboardingAnalyticsAccepted')
    dispatch(setCoreAnalytics(true))
    onNextScreen(nextScreen)
  }

  function rejectAnalytics(): void {
    capture('OnboardingAnalyticsRejected')
    dispatch(setCoreAnalytics(false))
    onNextScreen(nextScreen)
  }

  return (
    <ScrollView
      contentContainerStyle={{
        minHeight: '100%',
        paddingHorizontal: 16,
        paddingBottom: 32
      }}>
      <AvaText.LargeTitleBold>Help Us Improve</AvaText.LargeTitleBold>
      <Space y={23} />
      <AvaText.Body1>
        Core would like to gather data to understand how users interact with the
        app.
      </AvaText.Body1>
      <Space y={16} />
      <AvaText.Body1>
        {
          'This enables us to develop improvements. To learn more please read our '
        }
        <AvaText.Body1
          textStyle={{ color: theme.colorPrimary1 }}
          onPress={openPrivacyPolicy}>
          Privacy Policy
        </AvaText.Body1>
        . You can always opt out by visiting the settings page.
      </AvaText.Body1>
      <Space y={24} />
      <FlexSpacer />
      <AvaText.Heading2 textStyle={{ alignSelf: 'center' }}>
        Core will...
      </AvaText.Heading2>
      <Space y={24} />
      <Row style={{ alignItems: 'center', paddingHorizontal: 8 }}>
        <CheckmarkSVG color={theme.colorSuccess} />
        <Space x={20} />
        <AvaText.Body1 textStyle={{ flex: 1 }}>
          <AvaText.Body1 textStyle={{ fontWeight: 'bold' }}>
            Never{' '}
          </AvaText.Body1>
          collect keys, public addresses, balances, or hashes
        </AvaText.Body1>
      </Row>
      <Space y={24} />
      <Row style={{ alignItems: 'center', paddingHorizontal: 8 }}>
        <CheckmarkSVG color={theme.colorSuccess} />
        <Space x={20} />
        <AvaText.Body1 textStyle={{ flex: 1 }}>
          <AvaText.Body1 textStyle={{ fontWeight: 'bold' }}>
            Never{' '}
          </AvaText.Body1>
          collect full IP addresses
        </AvaText.Body1>
      </Row>
      <Space y={24} />
      <Row style={{ alignItems: 'center', paddingHorizontal: 8 }}>
        <CheckmarkSVG color={theme.colorSuccess} />
        <Space x={20} />
        <AvaText.Body1 textStyle={{ flex: 1 }}>
          <AvaText.Body1 textStyle={{ fontWeight: 'bold' }}>
            Never{' '}
          </AvaText.Body1>
          sell or share data. Ever!
        </AvaText.Body1>
      </Row>
      <FlexSpacer />
      <Space y={24} />
      <AvaButton.SecondaryLarge onPress={acceptAnalytics} testID="iAgreeBtn">
        I Agree
      </AvaButton.SecondaryLarge>
      <Space y={16} />
      <AvaButton.SecondaryLarge onPress={rejectAnalytics} testID="noThanksBtn">
        No Thanks
      </AvaButton.SecondaryLarge>
    </ScrollView>
  )
}

export default AnalyticsConsent
