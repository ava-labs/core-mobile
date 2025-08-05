import React, { useCallback, useMemo } from 'react'
import { GroupList } from '@avalabs/k2-alpine'
import DeviceInfo from 'react-native-device-info'
import {
  BUG_REPORT_URL,
  FEATURE_REQUEST_URL,
  HELP_URL,
  PRIVACY_POLICY_URL,
  TERMS_OF_USE_URL
} from 'common/consts/urls'
import SentryService from 'services/sentry/SentryService'

const VERSION = DeviceInfo.getReadableVersion()

export const About = ({
  onPressItem
}: {
  onPressItem: ({ url, title }: { url: string; title: string }) => void
}): React.JSX.Element => {
  const user = useMemo(() => SentryService.getUser(), [])

  const openHelpCenter = useCallback(() => {
    onPressItem({
      url: HELP_URL,
      title: 'Help center'
    })
  }, [onPressItem])

  const openBugReport = useCallback(() => {
    onPressItem({
      url: BUG_REPORT_URL,
      title: 'Bug report'
    })
  }, [onPressItem])

  const openFeatureRequest = useCallback(() => {
    onPressItem({
      url: FEATURE_REQUEST_URL,
      title: 'Feature request'
    })
  }, [onPressItem])

  const openTermsOfUse = useCallback(() => {
    onPressItem({
      url: TERMS_OF_USE_URL,
      title: 'Terms of use'
    })
  }, [onPressItem])

  const openPrivacyPolicy = useCallback(() => {
    onPressItem({
      url: PRIVACY_POLICY_URL,
      title: 'Privacy policy'
    })
  }, [onPressItem])

  const data = useMemo(() => {
    const items = [
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

    if (user?.id) {
      items.push({
        title: 'User ID',
        value: user.id.toString()
      })
    }

    return items
  }, [
    openBugReport,
    openFeatureRequest,
    openTermsOfUse,
    openPrivacyPolicy,
    openHelpCenter,
    user
  ])

  return (
    <GroupList
      data={data}
      titleSx={{ fontSize: 16, lineHeight: 22, fontFamily: 'Inter-Regular' }}
      separatorMarginRight={16}
    />
  )
}
