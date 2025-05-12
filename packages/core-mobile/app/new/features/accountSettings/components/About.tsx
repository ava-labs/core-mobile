import React, { useCallback } from 'react'
import { GroupList } from '@avalabs/k2-alpine'
import DeviceInfo from 'react-native-device-info'
import {
  BUG_REPORT_URL,
  FEATURE_REQUEST_URL,
  HELP_URL,
  PRIVACY_POLICY_URL,
  TERMS_OF_USE_URL
} from 'common/consts/urls'
import { useCoreBrowser } from 'new/common/hooks/useCoreBrowser'

const VERSION = DeviceInfo.getReadableVersion()

export const About = (): React.JSX.Element => {
  const { openUrl } = useCoreBrowser()

  const openHelpCenter = useCallback(() => {
    openUrl({
      url: HELP_URL,
      title: 'Help center'
    })
  }, [openUrl])

  const openBugReport = (): void => {
    openUrl({
      url: BUG_REPORT_URL,
      title: 'Bug report'
    })
  }

  const openFeatureRequest = (): void => {
    openUrl({
      url: FEATURE_REQUEST_URL,
      title: 'Feature request'
    })
  }

  const openTermsOfUse = (): void => {
    openUrl({
      url: TERMS_OF_USE_URL,
      title: 'Terms of use'
    })
  }

  const openPrivacyPolicy = (): void => {
    openUrl({
      url: PRIVACY_POLICY_URL,
      title: 'Privacy policy'
    })
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
