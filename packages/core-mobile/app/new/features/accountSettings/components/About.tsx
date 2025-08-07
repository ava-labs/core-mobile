import React, { useCallback, useMemo } from 'react'
import { GroupList, GroupListItem } from '@avalabs/k2-alpine'
import DeviceInfo from 'react-native-device-info'
import { PRIVACY_POLICY_URL, TERMS_OF_USE_URL } from 'common/consts/urls'

const VERSION = DeviceInfo.getReadableVersion()

export const About = ({
  onPressItem
}: {
  onPressItem: ({ url, title }: { url: string; title: string }) => void
}): React.JSX.Element => {
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
    const items: GroupListItem[] = [
      {
        title: 'Terms of use',
        onPress: openTermsOfUse
      },
      {
        title: 'Privacy policy',
        onPress: openPrivacyPolicy
      },
      {
        title: 'App version',
        value: VERSION
      }
    ]

    return items
  }, [openTermsOfUse, openPrivacyPolicy])

  return (
    <GroupList
      data={data}
      titleSx={{ fontSize: 16, lineHeight: 22, fontFamily: 'Inter-Regular' }}
      textContainerSx={{ marginRight: 32 }}
      separatorMarginRight={16}
    />
  )
}
