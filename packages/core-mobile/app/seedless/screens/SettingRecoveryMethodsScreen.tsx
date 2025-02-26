import React, { useState } from 'react'
import AppNavigation from 'navigation/AppNavigation'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { FlatList } from 'react-native'
import SeedlessService from 'seedless/services/SeedlessService'
import { MFA } from 'seedless/types'
import Logger from 'utils/Logger'
import AvaListItem from 'components/AvaListItem'
import { SettingRecoveryMethodsScreenProps } from 'navigation/types'
import { Button, View } from '@avalabs/k2-mobile'
import { ShowSnackBar } from 'components/Snackbar'
import Loader from 'components/Loader'
import { SnackBarMessage } from 'seedless/components/SnackBarMessage'

type ScreenProps = SettingRecoveryMethodsScreenProps<
  typeof AppNavigation.SettingRecoveryMethods.SettingRecoveryMethods
>

export const SettingRecoveryMethodsScreen = (): JSX.Element => {
  const { navigate } = useNavigation<ScreenProps['navigation']>()
  const [recoveryMethods, setRecoveryMethods] = useState<MFA[]>()

  const handleRecoveryMethod = (mfa: MFA): void => {
    navigate(AppNavigation.SettingRecoveryMethods.SettingMFA, {
      mfa: mfa,
      canRemove: (recoveryMethods ?? []).length > 1
    })
  }

  const handleAccountVerified = (withMfa: boolean): void => {
    if (withMfa) {
      ShowSnackBar(
        <SnackBarMessage message="Recovery methods added successfully" />
      )
    }
  }

  function handleAddRecoveryMethod(): void {
    navigate(AppNavigation.Root.RecoveryMethods, {
      screen: AppNavigation.RecoveryMethods.AddRecoveryMethods,
      params: {
        mfas: recoveryMethods,
        onAccountVerified: handleAccountVerified
      }
    })
  }

  useFocusEffect(() => {
    SeedlessService.session
      .userMfa()
      .then(mfa => {
        setRecoveryMethods(mfa)
      })
      .catch(e => {
        Logger.error('failed to get user mfa', e)
      })
  })

  const renderItem = ({ item }: { item: MFA }): JSX.Element => {
    return (
      <AvaListItem.Base
        title={item.type === 'totp' ? 'Authenticator' : `Passkey`}
        subtitle={item.type === 'fido' ? item.name : undefined}
        showNavigationArrow={true}
        rightComponentVerticalAlignment="center"
        onPress={() => handleRecoveryMethod(item)}
      />
    )
  }

  return recoveryMethods === undefined ? (
    <Loader />
  ) : (
    <View sx={{ flex: 1 }}>
      <FlatList
        style={{ marginTop: 16 }}
        data={recoveryMethods}
        renderItem={renderItem}
      />
      <View sx={{ padding: 16, marginBottom: 30 }}>
        <Button
          leftIcon="add"
          type="secondary"
          size="xlarge"
          onPress={handleAddRecoveryMethod}>
          Add Recovery Methods
        </Button>
      </View>
    </View>
  )
}
