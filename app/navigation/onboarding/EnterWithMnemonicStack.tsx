import AppNavigation from 'navigation/AppNavigation'
import React, {
  createContext,
  Dispatch,
  useCallback,
  useContext,
  useEffect,
  useState
} from 'react'
import { useNavigation } from '@react-navigation/native'
import CreatePIN from 'screens/onboarding/CreatePIN'
import BiometricLogin from 'screens/onboarding/BiometricLogin'
import HdWalletLogin from 'screens/login/HdWalletLogin'
import { createStackNavigator } from '@react-navigation/stack'
import BiometricsSDK from 'utils/BiometricsSDK'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { MainHeaderOptions } from 'navigation/NavUtils'
import { usePosthogContext } from 'contexts/PosthogContext'
import TermsNConditionsModal from 'components/TermsNConditionsModal'
import { EnterWithMnemonicScreenProps } from '../types'

export type EnterWithMnemonicStackParamList = {
  [AppNavigation.LoginWithMnemonic.LoginWithMnemonic]: undefined
  [AppNavigation.LoginWithMnemonic.CreatePin]: undefined
  [AppNavigation.LoginWithMnemonic.BiometricLogin]: undefined
  [AppNavigation.LoginWithMnemonic.TermsNConditions]: undefined
}
const EnterWithMnemonicS =
  createStackNavigator<EnterWithMnemonicStackParamList>()

const EnterWithMnemonicContext = createContext<{
  mnemonic: string
  setMnemonic: Dispatch<string>
}>({} as any)

const EnterWithMnemonicStack = () => {
  const [mnemonic, setMnemonic] = useState('')

  return (
    <EnterWithMnemonicContext.Provider value={{ setMnemonic, mnemonic }}>
      <EnterWithMnemonicS.Navigator screenOptions={{ headerShown: false }}>
        <EnterWithMnemonicS.Screen
          options={MainHeaderOptions('')}
          name={AppNavigation.LoginWithMnemonic.LoginWithMnemonic}
          component={LoginWithMnemonicScreen}
        />
        <EnterWithMnemonicS.Screen
          options={{ headerShown: true, headerTitle: '' }}
          name={AppNavigation.LoginWithMnemonic.CreatePin}
          component={CreatePinScreen}
        />
        <EnterWithMnemonicS.Screen
          name={AppNavigation.LoginWithMnemonic.BiometricLogin}
          component={BiometricLoginScreen}
        />
        <EnterWithMnemonicS.Screen
          options={{ presentation: 'transparentModal' }}
          name={AppNavigation.LoginWithMnemonic.TermsNConditions}
          component={TermsNConditionsModalScreen}
        />
      </EnterWithMnemonicS.Navigator>
    </EnterWithMnemonicContext.Provider>
  )
}

type LoginNavigationProp = EnterWithMnemonicScreenProps<
  typeof AppNavigation.LoginWithMnemonic.LoginWithMnemonic
>['navigation']

const LoginWithMnemonicScreen = () => {
  const enterWithMnemonicContext = useContext(EnterWithMnemonicContext)
  const { navigate, goBack, addListener, removeListener } =
    useNavigation<LoginNavigationProp>()
  const { capture } = usePosthogContext()
  const { userSettingsRepo } = useApplicationContext().repo

  useEffect(captureBackEventFx, [
    addListener,
    capture,
    removeListener,
    userSettingsRepo
  ])

  function captureBackEventFx() {
    const callback = (e: { data: { action: { type: string } } }) => {
      if (e.data.action.type === 'GO_BACK') {
        capture('OnboardingCancelled').catch(() => undefined)
        userSettingsRepo.setSetting('CoreAnalytics', undefined)
      }
    }
    addListener('beforeRemove', callback)
    return () => removeListener('beforeRemove', callback)
  }

  const onEnterWallet = useCallback(m => {
    BiometricsSDK.clearWalletKey().then(() => {
      enterWithMnemonicContext.setMnemonic(m)
      navigate(AppNavigation.LoginWithMnemonic.CreatePin)
    })
  }, [])

  return <HdWalletLogin onEnterWallet={onEnterWallet} onBack={() => goBack()} />
}

type CreatePinNavigationProp = EnterWithMnemonicScreenProps<
  typeof AppNavigation.LoginWithMnemonic.CreatePin
>['navigation']

const CreatePinScreen = () => {
  const enterWithMnemonicContext = useContext(EnterWithMnemonicContext)
  const walletSetupHook = useApplicationContext().walletSetupHook
  const { navigate } = useNavigation<CreatePinNavigationProp>()
  const { capture } = usePosthogContext()

  const onPinSet = (pin: string): void => {
    capture('OnboardingPasswordSet').catch(() => undefined)
    if (enterWithMnemonicContext.mnemonic) {
      walletSetupHook
        .onPinCreated(enterWithMnemonicContext.mnemonic, pin, false)
        .then(value => {
          switch (value) {
            case 'useBiometry':
              navigate(AppNavigation.LoginWithMnemonic.BiometricLogin)
              break
            case 'enterWallet':
              navigate(AppNavigation.LoginWithMnemonic.TermsNConditions)
              break
          }
        })
    }
  }
  return <CreatePIN onPinSet={onPinSet} />
}

type BiometricLoginNavigationProp = EnterWithMnemonicScreenProps<
  typeof AppNavigation.LoginWithMnemonic.BiometricLogin
>['navigation']

const BiometricLoginScreen = () => {
  const enterWithMnemonicContext = useContext(EnterWithMnemonicContext)
  const { navigate } = useNavigation<BiometricLoginNavigationProp>()

  return (
    <BiometricLogin
      mnemonic={enterWithMnemonicContext.mnemonic}
      onBiometrySet={() => {
        navigate(AppNavigation.LoginWithMnemonic.TermsNConditions)
      }}
      onSkip={() => navigate(AppNavigation.LoginWithMnemonic.TermsNConditions)}
    />
  )
}

const TermsNConditionsModalScreen = () => {
  const enterWithMnemonicContext = useContext(EnterWithMnemonicContext)
  const walletSetupHook = useApplicationContext().walletSetupHook
  const { resetNavToRoot } = useApplicationContext().appNavHook

  return (
    <TermsNConditionsModal
      onNext={() => {
        walletSetupHook.enterWallet(enterWithMnemonicContext.mnemonic)
      }}
      onReject={() => resetNavToRoot()}
    />
  )
}

export default EnterWithMnemonicStack
