import {
  Button,
  Icons,
  ScrollView,
  Text,
  View,
  useTheme
} from '@avalabs/k2-mobile'
import React from 'react'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation, useRoute } from '@react-navigation/native'
import { Card } from 'seedless/components/Card'
import { Space } from 'components/Space'
import { SettingRecoveryMethodsScreenProps } from 'navigation/types'

type SettingRecoveryMethodsMFAScreenProps = SettingRecoveryMethodsScreenProps<
  typeof AppNavigation.SettingRecoveryMethods.SettingMFA
>

export const SettingRecoveryMethodsMFAScreen = (): JSX.Element => {
  const {
    params: { mfa, canRemove }
  } = useRoute<SettingRecoveryMethodsMFAScreenProps['route']>()
  const {
    theme: { colors }
  } = useTheme()
  const { navigate } =
    useNavigation<SettingRecoveryMethodsMFAScreenProps['navigation']>()

  const title = mfa.type === 'totp' ? 'Authenticator' : mfa.name
  const icon =
    mfa.type === 'totp' ? (
      <Icons.Communication.IconQRCode color={colors.$neutral50} />
    ) : (
      <Icons.Communication.IconKey color={colors.$neutral50} />
    )

  function handleChangeTotp(): void {
    navigate(AppNavigation.SettingRecoveryMethods.ChangeTotpConfirmation)
  }

  function handleRemovePasskey(fidoId: string): void {
    navigate(AppNavigation.SettingRecoveryMethods.RemovePasskeyConfirmation, {
      fidoId
    })
  }

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
          <Text variant="heading3">
            {mfa.type === 'totp' ? 'Authenticator App' : 'Passkey'}
          </Text>
          <Space y={20} />
          <Card icon={icon} title={title} />
        </View>
      </ScrollView>
      <View sx={{ padding: 16, marginBottom: 30 }}>
        {mfa.type === 'fido' && canRemove && (
          <Button
            type="tertiaryDanger"
            size="xlarge"
            onPress={() => handleRemovePasskey(mfa.id)}>
            Remove Recovery Method
          </Button>
        )}
        {mfa.type === 'totp' && (
          <Button type="secondary" size="xlarge" onPress={handleChangeTotp}>
            Change Authenticator App
          </Button>
        )}
      </View>
    </View>
  )
}
