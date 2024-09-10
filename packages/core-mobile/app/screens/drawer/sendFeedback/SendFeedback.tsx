import React from 'react'
import { Platform, View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaListItem from 'components/AvaListItem'
import useInAppBrowser from 'hooks/useInAppBrowser'
import DeviceInfo from 'react-native-device-info'

const SendFeedback = (): JSX.Element => {
  const { theme } = useApplicationContext()
  const { openUrl } = useInAppBrowser()

  const preselectPlatform =
    Platform.OS === 'ios' ? 'Core+mobile+(iOS)' : 'Core+mobile+(Android)'

  function openBugReport(): void {
    const version = DeviceInfo.getReadableVersion()
    openUrl(
      `https://docs.google.com/forms/d/e/1FAIpQLSdUQiVnJoqQ1g_6XTREpkSB5vxKKK8ba5DRjhzQf1XVeET8Rw/viewform?usp=pp_url&entry.2070152111=${preselectPlatform}&entry.903657115=${version}`
    )
  }

  function openFeatureRequest(): void {
    openUrl(
      `https://docs.google.com/forms/d/e/1FAIpQLSdQ9nOPPGjVPmrLXh3B9NR1NuXXUiW2fKW1ylrXpiW_vZB_hw/viewform?entry.2070152111=${preselectPlatform}`
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
