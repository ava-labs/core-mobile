import AppNavigation from 'navigation/AppNavigation'
import React, {
  createContext,
  Dispatch,
  useCallback,
  useContext,
  useState
} from 'react'
import { useNavigation } from '@react-navigation/native'
import CreatePIN from 'screens/onboarding/CreatePIN'
import BiometricLogin from 'screens/onboarding/BiometricLogin'
import HdWalletLogin from 'screens/login/HdWalletLogin'
import { createStackNavigator } from '@react-navigation/stack'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { MainHeaderOptions } from 'navigation/NavUtils'
import TermsNConditionsModal from 'components/TermsNConditionsModal'
import { selectWalletState, WalletState } from 'store/app'
import { useDispatch, useSelector } from 'react-redux'
import {
  RemoveEvents,
  useBeforeRemoveListener
} from 'hooks/useBeforeRemoveListener'
import { usePostCapture } from 'hooks/usePosthogCapture'
import OwlLoader from 'components/OwlLoader'
import { setCoreAnalytics } from 'store/settings/securityPrivacy'
import Logger from 'utils/Logger'
import { EnterWithMnemonicScreenProps } from '../types'

export type EnterWithMnemonicStackParamList = {
  [AppNavigation.LoginWithMnemonic.LoginWithMnemonic]: undefined
  [AppNavigation.LoginWithMnemonic.CreatePin]: undefined
  [AppNavigation.LoginWithMnemonic.BiometricLogin]: undefined
  [AppNavigation.LoginWithMnemonic.TermsNConditions]: undefined
  [AppNavigation.LoginWithMnemonic.Loader]: undefined
}
const EnterWithMnemonicS =
  createStackNavigator<EnterWithMnemonicStackParamList>()

type EnterWithMnemonicContextState = {
  mnemonic: string
  setMnemonic: Dispatch<string>
}

const EnterWithMnemonicContext = createContext(
  {} as EnterWithMnemonicContextState
)

const EnterWithMnemonicStack = (): JSX.Element => {
  const [mnemonic, setMnemonic] = useState('')

  return (
    <EnterWithMnemonicContext.Provider value={{ setMnemonic, mnemonic }}>
      <EnterWithMnemonicS.Navigator screenOptions={{ headerShown: false }}>
        <EnterWithMnemonicS.Screen
          options={MainHeaderOptions()}
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
        <EnterWithMnemonicS.Screen
          name={AppNavigation.LoginWithMnemonic.Loader}
          component={OwlLoader}
        />
      </EnterWithMnemonicS.Navigator>
    </EnterWithMnemonicContext.Provider>
  )
}

type LoginNavigationProp = EnterWithMnemonicScreenProps<
  typeof AppNavigation.LoginWithMnemonic.LoginWithMnemonic
>['navigation']

const LoginWithMnemonicScreen = (): JSX.Element => {
  const enterWithMnemonicContext = useContext(EnterWithMnemonicContext)
  const { navigate, goBack } = useNavigation<LoginNavigationProp>()
  const { capture } = usePostCapture()
  const dispatch = useDispatch()
  const { deleteWallet } = useApplicationContext().appHook
  const walletState = useSelector(selectWalletState)
  const isWalletExisted = walletState !== WalletState.NONEXISTENT

  useBeforeRemoveListener(
    useCallback(() => {
      capture('OnboardingCancelled')
      dispatch(setCoreAnalytics(undefined))
    }, [capture, dispatch]),
    [RemoveEvents.GO_BACK]
  )

  const onEnterWallet = useCallback(
    m => {
      // if a wallet already existed, we want to clear out
      // existing data first before entering with this new wallet
      if (isWalletExisted) {
        deleteWallet()
      }
      enterWithMnemonicContext.setMnemonic(m)
      navigate(AppNavigation.LoginWithMnemonic.CreatePin)
    },
    [isWalletExisted, enterWithMnemonicContext, navigate, deleteWallet]
  )

  return <HdWalletLogin onEnterWallet={onEnterWallet} onBack={() => goBack()} />
}

type CreatePinNavigationProp = EnterWithMnemonicScreenProps<
  typeof AppNavigation.LoginWithMnemonic.CreatePin
>['navigation']

const CreatePinScreen = (): JSX.Element => {
  const enterWithMnemonicContext = useContext(EnterWithMnemonicContext)
  const walletSetupHook = useApplicationContext().walletSetupHook
  const { navigate } = useNavigation<CreatePinNavigationProp>()
  const { capture } = usePostCapture()

  const onPinSet = (pin: string): void => {
    capture('OnboardingPasswordSet')
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
        .catch(Logger.error)
    }
  }
  return <CreatePIN onPinSet={onPinSet} />
}

type BiometricLoginNavigationProp = EnterWithMnemonicScreenProps<
  typeof AppNavigation.LoginWithMnemonic.BiometricLogin
>['navigation']

const BiometricLoginScreen = (): JSX.Element => {
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

const TermsNConditionsModalScreen = (): JSX.Element => {
  const enterWithMnemonicContext = useContext(EnterWithMnemonicContext)
  const walletSetupHook = useApplicationContext().walletSetupHook
  const { signOut } = useApplicationContext().appHook
  const { navigate } = useNavigation<BiometricLoginNavigationProp>()

  return (
    <TermsNConditionsModal
      onNext={() => {
        navigate(AppNavigation.LoginWithMnemonic.Loader)
        setTimeout(() => {
          // signing in with recovery phrase
          walletSetupHook
            .enterWallet(enterWithMnemonicContext.mnemonic)
            .catch(Logger.error)
        }, 300)
      }}
      onReject={() => signOut()}
    />
  )
}

export default EnterWithMnemonicStack
