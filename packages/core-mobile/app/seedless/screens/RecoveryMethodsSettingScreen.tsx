import React, { useEffect, useState } from 'react'
import { SecurityPrivacyScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation } from '@react-navigation/native'
import { FlatList } from 'react-native'
import SeedlessService from 'seedless/services/SeedlessService'
import { MFA } from 'seedless/types'
import Logger from 'utils/Logger'
import AvaListItem from 'components/AvaListItem'

type RecoveryMethodsSettingScreenProps = SecurityPrivacyScreenProps<
  typeof AppNavigation.SecurityPrivacy.RecoveryMethods
>

export const RecoveryMethodsSettingScreen = (): JSX.Element => {
  const navigation =
    useNavigation<RecoveryMethodsSettingScreenProps['navigation']>()
  const [recoveryMethods, setRecoveryMethods] = useState<MFA[]>()

  const handleRecoveryMethod = (mfa: MFA): void => {
    navigation.navigate(AppNavigation.SecurityPrivacy.MFASetting, {
      mfa: mfa
    })
  }

  useEffect(() => {
    SeedlessService.sessionManager
      .userMfa()
      .then(mfa => {
        setRecoveryMethods(mfa)
      })
      .catch(e => {
        Logger.error('failed to get user mfa', e)
      })
  }, [])

  const renderItem = ({ item }: { item: MFA }): JSX.Element => {
    return (
      <AvaListItem.Base
        title={item.type === 'totp' ? 'Authenticator' : item.name}
        showNavigationArrow={item.type === 'totp'}
        onPress={() => handleRecoveryMethod(item)}
      />
    )
  }

  return <FlatList data={recoveryMethods} renderItem={renderItem} />
}
