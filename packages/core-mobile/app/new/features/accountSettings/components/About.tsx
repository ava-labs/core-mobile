import { GroupList, GroupListItem, Icons, useTheme } from '@avalabs/k2-alpine'
import { PRIVACY_POLICY_URL, TERMS_OF_USE_URL } from 'common/consts/urls'
import { copyToClipboard } from 'common/utils/clipboard'
import React, { useCallback, useMemo } from 'react'
import DeviceInfo from 'react-native-device-info'

const VERSION = DeviceInfo.getReadableVersion()

export const About = ({
  onPressItem
}: {
  onPressItem: ({ url, title }: { url: string; title: string }) => void
}): React.JSX.Element => {
  const { theme } = useTheme()
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

  const copyAppVersion = useCallback(() => {
    copyToClipboard(VERSION, 'App version copied to clipboard')
  }, [])

  const data = useMemo(() => {
    const items: GroupListItem[] = [
      {
        title: 'Terms of use',
        onPress: openTermsOfUse,
        accessory: (
          <Icons.Custom.Outbound
            width={24}
            height={24}
            color={theme.colors.$textPrimary}
          />
        )
      },
      {
        title: 'Privacy policy',
        onPress: openPrivacyPolicy,
        accessory: (
          <Icons.Custom.Outbound
            width={24}
            height={24}
            color={theme.colors.$textPrimary}
          />
        )
      },
      {
        title: 'App version',
        value: VERSION,
        onPress: copyAppVersion,
        accessory: <></>
      }
    ]

    return items
  }, [openTermsOfUse, openPrivacyPolicy, copyAppVersion])

  return (
    <GroupList
      data={data}
      titleSx={{ fontSize: 16, lineHeight: 22, fontFamily: 'Inter-Regular' }}
      textContainerSx={{ marginRight: 32 }}
      valueSx={{ fontFamily: 'DejaVuSansMono', fontSize: 16 }}
      separatorMarginRight={16}
    />
  )
}
