import React, { useCallback } from 'react'
import { GroupList } from '@avalabs/k2-alpine'
import DeviceInfo from 'react-native-device-info'
import useInAppBrowser from 'common/hooks/useInAppBrowser'
import Logger from 'utils/Logger'
import {
  BUG_REPORT_URL,
  FEATURE_REQUEST_URL,
  HELP_URL,
  PRIVACY_POLICY_URL,
  TERMS_OF_USE_URL
} from 'common/consts/urls'

const VERSION = DeviceInfo.getReadableVersion()

export const About = (): React.JSX.Element => {
  const { openUrl } = useInAppBrowser()

  const openHelpCenter = useCallback(() => {
    openUrl(HELP_URL).catch(Logger.error)
  }, [openUrl])

  const openBugReport = (): void => {
    openUrl(BUG_REPORT_URL).catch(Logger.error)
  }

  const openFeatureRequest = (): void => {
    openUrl(FEATURE_REQUEST_URL).catch(Logger.error)
  }

  const openTermsOfUse = (): void => {
    openUrl(TERMS_OF_USE_URL).catch(Logger.error)
  }

  const openPrivacyPolicy = (): void => {
    openUrl(PRIVACY_POLICY_URL).catch(Logger.error)
  }

  const data = [
    {
      title: 'Send feedback',
      onPress: openFeatureRequest
    },
    {
      title: 'Report a bug',
      onPress: openBugReport
    },
    {
      title: 'Terms of use',
      onPress: openTermsOfUse
    },
    {
      title: 'Privacy policy',
      onPress: openPrivacyPolicy
    },
    {
      title: 'Help center',
      onPress: openHelpCenter
    },
    {
      title: 'App version',
      value: VERSION
    }
  ]

  return (
    <GroupList
      data={data}
      titleSx={{ fontSize: 16, lineHeight: 22, fontFamily: 'Inter-Regular' }}
      separatorMarginRight={16}
    />
  )
}
