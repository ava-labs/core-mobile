import { Icons, ScrollView, Text, View, useTheme } from '@avalabs/k2-mobile'
import React from 'react'
import { SecurityPrivacyScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useRoute } from '@react-navigation/native'
import { Card } from 'seedless/components/Card'
import { Space } from 'components/Space'

type RecoveryMethodsSettingMFAScreenProps = SecurityPrivacyScreenProps<
  typeof AppNavigation.SecurityPrivacy.MFASetting
>

export const RecoveryMethodsSettingMFAScreen = (): JSX.Element => {
  const {
    params: { mfa }
  } = useRoute<RecoveryMethodsSettingMFAScreenProps['route']>()
  const {
    theme: { colors }
  } = useTheme()

  const title = mfa.type === 'totp' ? 'Authenticator' : mfa.name
  const icon =
    mfa.type === 'totp' ? (
      <Icons.Communication.IconQRCode color={colors.$neutral50} />
    ) : (
      <Icons.Communication.IconKey color={colors.$neutral50} />
    )

  return (
    <View
      sx={{
        flex: 1
      }}>
      <ScrollView
        sx={{
          flexGrow: 1
        }}
        contentContainerSx={{
          paddingHorizontal: 16
        }}
        keyboardDismissMode="on-drag">
        <View sx={{ flexGrow: 1 }}>
          <Text variant="heading3">Authenticator App</Text>
          <Space y={20} />
          <Card icon={icon} title={title} />
        </View>
      </ScrollView>
    </View>
  )
}
