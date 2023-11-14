import { useNavigation } from '@react-navigation/native'
import AppNavigation from 'navigation/AppNavigation'
import { OnboardScreenProps } from 'navigation/types'
import { Alert } from 'react-native'
import CoreSeedlessAPIService, {
  SeedlessUserRegistrationResult
} from 'seedless/services/CoreSeedlessAPIService'
import GoogleSigninService from 'seedless/services/GoogleSigninService'

interface GoogleSignInHook {
  signInWithGoogle: (setIsLoading: (value: boolean) => void) => Promise<void>
}

type NavigationProp = OnboardScreenProps<
  typeof AppNavigation.Onboard.Signup
>['navigation']

export const useSignInWithGoogle = (): GoogleSignInHook => {
  const navigation = useNavigation<NavigationProp>()

  const signInWithGoogle = async (
    setIsLoading: (value: boolean) => void
  ): Promise<void> => {
    const oidcToken = await GoogleSigninService.signin()
    setIsLoading(true)
    const result = await CoreSeedlessAPIService.register(oidcToken)

    if (result === SeedlessUserRegistrationResult.APPROVED) {
      setIsLoading(false)
      navigation.navigate(AppNavigation.Onboard.RecoveryMethods)
    } else if (result === SeedlessUserRegistrationResult.ALREADY_REGISTERED) {
      // todo: if user is already registered, but no mfa setup
      // todo: prompt user to setup mfa
      setIsLoading(false)
      // @ts-ignore
      navigation.navigate(AppNavigation.Onboard.RecoveryMethods, {
        screen: AppNavigation.RecoveryMethods.VerifyCode
      })
    } else if (result === SeedlessUserRegistrationResult.ERROR) {
      setIsLoading(false)
      Alert.alert('seedless user registration error')
    }
  }

  return {
    signInWithGoogle
  }
}
