import React from 'react'
import { Platform, View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaListItem from 'components/AvaListItem'
import useInAppBrowser from 'hooks/useInAppBrowser'
import DeviceInfo from 'react-native-device-info'

const SendFeedback = () => {
  const { theme } = useApplicationContext()
  const { openUrl } = useInAppBrowser()

  function openBugReport() {
    const version = DeviceInfo.getReadableVersion()
    const preselectPlatform =
      Platform.OS === 'ios' ? 'Core+mobile+(iOS)' : 'Core+mobile+(Android)'
    openUrl(
      `https://docs.google.com/forms/d/e/1FAIpQLSdUQiVnJoqQ1g_6XTREpkSB5vxKKK8ba5DRjhzQf1XVeET8Rw/viewform?usp=pp_url&entry.2070152111=${preselectPlatform}&entry.903657115=${version}`
    )
  }

  function openFeatureRequest() {
    openUrl(
      `https://portal.productboard.com/dndv9ahlkdfye4opdm8ksafi/tabs/2-core-mobile`
    )
  }

  return (
    <View style={{ backgroundColor: theme.colorBg2 }}>
      <AvaListItem.Base
        title={'Report a Bug'}
        background={theme.background}
        showNavigationArrow
        onPress={openBugReport}
        testID="send_feedback__report_a_bug"
      />
      <AvaListItem.Base
        title={'Product Feedback & Feature Requests'}
        background={theme.background}
        showNavigationArrow
        onPress={openFeatureRequest}
        testID="send_feedback__feature_request"
      />
    </View>
  )
}

export default SendFeedback
