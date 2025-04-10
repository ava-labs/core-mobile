import React, { useState, useCallback, useEffect } from 'react'
import { useFocusEffect, useRouter } from 'expo-router'
import {
  Icons,
  ScrollView,
  showAlert,
  TouchableOpacity,
  useTheme
} from '@avalabs/k2-alpine'
import { MFA } from 'seedless/types'
import SeedlessService from 'seedless/services/SeedlessService'
import { useRegisteredRecoveryMethods } from 'features/onboarding/hooks/useRegisteredRecoveryMethods'
import {
  RecoveryMethod,
  RecoveryMethods
} from 'features/onboarding/hooks/useAvailableRecoveryMethods'
import { ManageRecoveryMethods } from 'features/onboarding/components/ManageRecoveryMethods'
import ScreenHeader from 'common/components/ScreenHeader'
import { useNavigation } from '@react-navigation/native'
import { useSeedlessManageRecoveryMethodsContext } from 'features/accountSettings/context/SeedlessManageRecoveryMethodsProvider'

const ManageRecoveryMethodsScreen = (): JSX.Element => {
  const { navigate } = useRouter()
  const {
    theme: { colors }
  } = useTheme()
  const { getParent } = useNavigation()
  const [mfaMethods, setMfaMethods] = useState<MFA[]>([])
  const registeredRecoveryMethods = useRegisteredRecoveryMethods(mfaMethods)
  const { totpResetInit, fidoDelete } =
    useSeedlessManageRecoveryMethodsContext()

  // useFocusEffect(
  //   useCallback(() => {
  //     const getMfaMethods = async (): Promise<void> => {
  //       const mfas = await SeedlessService.session.userMfa()
  //       setMfaMethods(mfas)
  //     }
  //     getMfaMethods()
  //   }, [])
  // )

  useEffect(() => {
    const getMfaMethods = async (): Promise<void> => {
      const mfas = await SeedlessService.session.userMfa()
      setMfaMethods(mfas)
    }
    getMfaMethods()
  }, [])

  const renderHeaderRight = useCallback(() => {
    return (
      <TouchableOpacity
        onPress={() =>
          navigate('/accountSettings/addRecoveryMethods/available')
        }
        sx={{
          flexDirection: 'row',
          gap: 16,
          marginTop: 14,
          marginRight: 18,
          alignItems: 'center'
        }}>
        <Icons.Content.Add color={colors.$textPrimary} />
      </TouchableOpacity>
    )
  }, [colors.$textPrimary, navigate])

  useFocusEffect(() => {
    getParent()?.setOptions({
      headerRight: renderHeaderRight
    })

    return () => {
      getParent()?.setOptions({
        headerRight: undefined
      })
    }
  })

  const handleChangeAuthenticator = useCallback((): void => {
    showAlert({
      title: 'Change authenticator',
      description:
        'You will no longer be able to use this authenticator once your switch. You can always re-add an authenticator app.',
      buttons: [
        {
          text: 'Change',
          onPress: totpResetInit
        },
        {
          text: 'Cancel',
          style: 'cancel'
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
              text: 'OK',
              style: 'cancel'
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
            text: 'Remove',
            onPress: () => {
              fidoDelete(mfaId)
            }
          },
          {
            text: 'Cancel',
            style: 'cancel'
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

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      scrollEventThrottle={16}
      contentContainerStyle={{ paddingBottom: 60, paddingHorizontal: 16 }}>
      <ScreenHeader title={`Manage recovery\nmethods`} />
      <ManageRecoveryMethods
        data={registeredRecoveryMethods}
        onPress={handleSelectedMfa}
        sx={{ marginTop: 16 }}
      />
    </ScrollView>
  )
}

export default ManageRecoveryMethodsScreen
