import AppNavigation from 'navigation/AppNavigation'
import React from 'react'
import { useNavigation } from '@react-navigation/native'
import CreatePIN from 'screens/onboarding/CreatePIN'
import BiometricLogin from 'screens/onboarding/BiometricLogin'
import { createStackNavigator } from '@react-navigation/stack'
import { MainHeaderOptions } from 'navigation/NavUtils'
import { useApplicationContext } from 'contexts/ApplicationContext'
import TermsNConditionsModal from 'components/TermsNConditionsModal'
import { onLogIn } from 'store/app'
import { useDispatch } from 'react-redux'
import { usePostCapture } from 'hooks/usePosthogCapture'
import OwlLoader from 'components/OwlLoader'
import Logger from 'utils/Logger'
import { CreateWalletScreenProps } from '../types'

export type CreatePinStackParamList = {
  [AppNavigation.CreateWallet.CreatePin]: undefined
  [AppNavigation.CreateWallet.BiometricLogin]: undefined
  [AppNavigation.CreateWallet.TermsNConditions]: undefined
  [AppNavigation.CreateWallet.Loader]: undefined
}
const CreatePinS = createStackNavigator<CreatePinStackParamList>()

const CreatePinStack: () => JSX.Element = () => {
  return (
    <CreatePinS.Navigator screenOptions={{ headerShown: false }}>
      <CreatePinS.Screen
        options={MainHeaderOptions()}
        name={AppNavigation.CreateWallet.CreatePin}
        component={CreatePinScreen}
      />
      <CreatePinS.Screen
        options={{ headerShown: true, headerTitle: '' }}
        name={AppNavigation.CreateWallet.BiometricLogin}
        component={BiometricLoginScreen}
      />
      <CreatePinS.Screen
        options={{ presentation: 'transparentModal' }}
        name={AppNavigation.CreateWallet.TermsNConditions}
        component={TermsNConditionsModalScreen}
      />
      <CreatePinS.Screen
        name={AppNavigation.CreateWallet.Loader}
        component={OwlLoader}
      />
    </CreatePinS.Navigator>
  )
}

type CreatePinNavigationProp = CreateWalletScreenProps<
  typeof AppNavigation.CreateWallet.CreatePin
>['navigation']

const CreatePinScreen = (): JSX.Element => {
  const walletSetupHook = useApplicationContext().walletSetupHook
  const { navigate } = useNavigation<CreatePinNavigationProp>()
  const { capture } = usePostCapture()

  const onPinSet = (pin: string): void => {
    capture('OnboardingPasswordSet')
    walletSetupHook
      .onPinCreated('', pin, false)
      .then(value => {
        switch (value) {
          case 'useBiometry':
            navigate(AppNavigation.CreateWallet.BiometricLogin)
            break
          case 'enterWallet':
            navigate(AppNavigation.CreateWallet.TermsNConditions)
            break
        }
      })
      .catch(Logger.error)
  }

  return <CreatePIN onPinSet={onPinSet} />
}

type BiometricLoginNavigationProp = CreateWalletScreenProps<
  typeof AppNavigation.CreateWallet.BiometricLogin
>['navigation']

const BiometricLoginScreen = (): JSX.Element => {
  const { navigate } = useNavigation<BiometricLoginNavigationProp>()
  return (
    <BiometricLogin
      mnemonic={''}
      onBiometrySet={() => {
        navigate(AppNavigation.CreateWallet.TermsNConditions)
      }}
      onSkip={() => navigate(AppNavigation.CreateWallet.TermsNConditions)}
    />
  )
}

const TermsNConditionsModalScreen = (): JSX.Element => {
  const walletSetupHook = useApplicationContext().walletSetupHook
  const { signOut } = useApplicationContext().appHook
  const dispatch = useDispatch()
  const { navigate } = useNavigation<BiometricLoginNavigationProp>()

  return (
    <TermsNConditionsModal
      onNext={() => {
        navigate(AppNavigation.CreateWallet.Loader)
        setTimeout(() => {
          // signing in with a brand new wallet
          walletSetupHook
            .enterWallet('')
            .then(() => {
              dispatch(onLogIn())
            })
            .catch(Logger.error)
        }, 300)
      }}
      onReject={() => signOut()}
    />
  )
}

export default CreatePinStack
