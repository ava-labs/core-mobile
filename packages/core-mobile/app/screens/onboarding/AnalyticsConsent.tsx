import React, { useEffect } from 'react'
import { Space } from 'components/Space'
import { Linking, ScrollView } from 'react-native'
import { PRIVACY_POLICY_URL } from 'resources/Constants'
import { useDispatch } from 'react-redux'
import { setCoreAnalytics } from 'store/settings/securityPrivacy'
import { useAnalytics } from 'hooks/useAnalytics'
import { Button, Text, View } from '@avalabs/k2-mobile'
import { ViewOnceKey, setViewOnce } from 'store/viewOnce'

type Props = {
  onDone: () => void
}

const AnalyticsConsent = ({ onDone }: Props): JSX.Element => {
  const dispatch = useDispatch()
  const { capture } = useAnalytics()

  function openPrivacyPolicy(): void {
    Linking.openURL(PRIVACY_POLICY_URL)
  }

  function acceptAnalytics(): void {
    capture('OnboardingAnalyticsAccepted')
    dispatch(setCoreAnalytics(true))
    onDone()
  }

  function rejectAnalytics(): void {
    capture('OnboardingAnalyticsRejected')
    dispatch(setCoreAnalytics(false))
    onDone()
  }

  useEffect(() => {
    return () => {
      dispatch(setViewOnce(ViewOnceKey.ANALYTICS_CONSENT))
    }
  }, [dispatch])

  return (
    <>
      <ScrollView
        contentContainerStyle={{
          minHeight: '100%',
          paddingHorizontal: 16,
          paddingBottom: 32
        }}>
        <Text variant="heading3">Help Us Improve</Text>
        <Space y={23} />
        <Text variant="body1">
          Core would like to gather data using local storage and similar
          technologies to help us understand how our users interact with Core.
        </Text>
        <Space y={16} />
        <Text variant="body1">
          {
            'This enables us to develop improvements and enhance your experience, to find out more you can read our '
          }
          <Text
            variant="body1"
            sx={{ color: '$blueMain' }}
            onPress={openPrivacyPolicy}>
            Privacy Policy
          </Text>
          .
        </Text>
        <Space y={16} />
        <Text variant="body1">
          You can always opt out by visiting the settings page.
        </Text>
        <Space y={16} />
        <Text variant="body1">
          Core will <Text sx={{ fontWeight: '700' }}>never</Text> sell or share
          data.
        </Text>
      </ScrollView>
      <View sx={{ padding: 16 }}>
        <Button
          size="xlarge"
          type="primary"
          onPress={acceptAnalytics}
          testID="iAgreeBtn">
          I Agree
        </Button>
        <Space y={16} />
        <Button
          size="xlarge"
          type="secondary"
          onPress={rejectAnalytics}
          testID="noThanksBtn">
          No Thanks
        </Button>
      </View>
    </>
  )
}

export default AnalyticsConsent
