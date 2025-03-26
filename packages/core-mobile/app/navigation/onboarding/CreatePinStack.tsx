import AppNavigation from 'navigation/AppNavigation'
import React from 'react'
import { useNavigation } from '@react-navigation/native'
import CreatePIN from 'screens/onboarding/CreatePIN'
import BiometricLogin from 'screens/onboarding/BiometricLogin'
import { createStackNavigator } from '@react-navigation/stack'
import { MainHeaderOptions, getModalOptions } from 'navigation/NavUtils'
import { useApplicationContext } from 'contexts/ApplicationContext'
import TermsNConditionsModal from 'components/TermsNConditionsModal'
import Logger from 'utils/Logger'
import { WalletType } from 'services/wallet/types'
import { useWallet } from 'hooks/useWallet'
import AnalyticsService from 'services/analytics/AnalyticsService'
import LogoLoader from 'components/LogoLoader'
import { uuid } from 'utils/uuid'
import { CreateWalletScreenProps } from '../types'
// This stack is for Seedless
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
        options={{
          ...getModalOptions()
        }}
        name={AppNavigation.CreateWallet.TermsNConditions}
        component={TermsNConditionsModalScreen}
      />
      <CreatePinS.Screen
        name={AppNavigation.CreateWallet.Loader}
        component={LogoLoader}
      />
    </CreatePinS.Navigator>
  )
}

type CreatePinNavigationProp = CreateWalletScreenProps<
  typeof AppNavigation.CreateWallet.CreatePin
>['navigation']

const CreatePinScreen = (): JSX.Element => {
  const { onPinCreated } = useWallet()
  const { navigate } = useNavigation<CreatePinNavigationProp>()

  const onPinSet = (pin: string): void => {
    AnalyticsService.capture('OnboardingPasswordSet')

    /**
     * we are using a dummy mnemonic here
     * even though we are creating a seedless wallet.
     * this allows our pin/biometric logic to work normally
     */
    onPinCreated({
      mnemonic: uuid(),
      pin,
      isResetting: false,
      walletType: WalletType.SEEDLESS
    })
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
      mnemonic={uuid()}
      onBiometrySet={() => {
        navigate(AppNavigation.CreateWallet.TermsNConditions)
      }}
      onSkip={() => navigate(AppNavigation.CreateWallet.TermsNConditions)}
    />
  )
}

const TermsNConditionsModalScreen = (): JSX.Element => {
  const { login } = useWallet()
  const { signOut } = useApplicationContext().appHook
  const { navigate } = useNavigation<BiometricLoginNavigationProp>()

  return (
    <TermsNConditionsModal
      onNext={() => {
        navigate(AppNavigation.CreateWallet.Loader)
        setTimeout(() => {
          // creating/recovering a seedless wallet
          login(uuid(), WalletType.SEEDLESS).catch(Logger.error)
        }, 300)
      }}
      onReject={() => signOut()}
    />
  )
}

export default CreatePinStack
