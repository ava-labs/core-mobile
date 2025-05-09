import { Icons, showAlert, useTheme, View } from '@avalabs/k2-alpine'
import NavigationBarButton from 'common/components/NavigationBarButton'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useUserMfa } from 'common/hooks/useUserMfa'
import { useFocusEffect, useRouter } from 'expo-router'
import { useRecoveryMethodsContext } from 'features/accountSettings/context/RecoverMethodsProvider'
import { ManageRecoveryMethods } from 'features/onboarding/components/ManageRecoveryMethods'
import {
  RecoveryMethod,
  RecoveryMethods
} from 'features/onboarding/hooks/useAvailableRecoveryMethods'
import { useRegisteredRecoveryMethods } from 'features/onboarding/hooks/useRegisteredRecoveryMethods'
import React, { useCallback } from 'react'
import { Loader } from '../../../../../common/components/Loader'

const ManageRecoveryMethodsScreen = (): JSX.Element => {
  const { navigate } = useRouter()
  const {
    theme: { colors }
  } = useTheme()
  const { data: mfaMethods, isLoading, refetch } = useUserMfa()
  const registeredRecoveryMethods = useRegisteredRecoveryMethods(mfaMethods)
  const { totpResetInit, fidoDelete } = useRecoveryMethodsContext()

  useFocusEffect(
    useCallback(() => {
      refetch()
    }, [refetch])
  )

  const handleChangeAuthenticator = useCallback((): void => {
    showAlert({
      title: 'Change authenticator',
      description:
        'You will no longer be able to use this authenticator once your switch. You can always re-add an authenticator app.',
      buttons: [
        {
          text: 'Cancel'
        },

        {
          text: 'Change',
          onPress: totpResetInit
        }
      ]
    })
  }, [totpResetInit])

  const handleRemoveFido = useCallback(
    (mfaId: string): void => {
      if (registeredRecoveryMethods.length === 1) {
        showAlert({
          title: 'Can not remove last recovery method',
          description:
            'You need at least one recovery method to be able to recover your account.',
          buttons: [
            {
              text: 'Got it'
            }
          ]
        })
        return
      }
      showAlert({
        title: 'Remove recovery method',
        description: 'Are you sure you want to remove this recovery method?',
        buttons: [
          {
            text: 'Cancel'
          },

          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => {
              fidoDelete(mfaId)
            }
          }
        ]
      })
    },
    [fidoDelete, registeredRecoveryMethods.length]
  )

  const handleSelectedMfa = useCallback(
    (recoveryMethod: RecoveryMethod): void => {
      if (recoveryMethod.type === RecoveryMethods.Authenticator) {
        handleChangeAuthenticator()
        return
      }

      if (
        recoveryMethod.type === RecoveryMethods.Passkey ||
        recoveryMethod.type === RecoveryMethods.Yubikey
      ) {
        recoveryMethod.mfa?.type === 'fido' &&
          handleRemoveFido(recoveryMethod.mfa.id)
      }
    },
    [handleChangeAuthenticator, handleRemoveFido]
  )

  const renderHeaderRight = useCallback(() => {
    return (
      <NavigationBarButton
        isModal
        onPress={() =>
          // @ts-ignore TODO: make routes typesafe
          navigate('/accountSettings/addRecoveryMethods/available')
        }>
        <Icons.Content.Add color={colors.$textPrimary} />
      </NavigationBarButton>
    )
  }, [colors.$textPrimary, navigate])

  return (
    <ScrollScreen
      title={`Manage recovery\nmethods`}
      isModal
      hasParent
      navigationTitle="Manage recovery methods"
      renderHeaderRight={renderHeaderRight}
      contentContainerStyle={{ padding: 16, flex: 1 }}>
      {isLoading ? (
        <Loader />
      ) : (
        <View
          style={{
            marginTop: 24
          }}>
          <ManageRecoveryMethods
            data={registeredRecoveryMethods}
            onPress={handleSelectedMfa}
          />
        </View>
      )}
    </ScrollScreen>
  )
}

export default ManageRecoveryMethodsScreen
