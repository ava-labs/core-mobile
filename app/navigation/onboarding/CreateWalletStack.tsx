import AppNavigation from 'navigation/AppNavigation'
import React, {
  createContext,
  Dispatch,
  useCallback,
  useContext,
  useState
} from 'react'
import CreateWallet from 'screens/onboarding/CreateWallet'
import { useNavigation } from '@react-navigation/native'
import CheckMnemonic from 'screens/onboarding/CheckMnemonic'
import CreatePIN from 'screens/onboarding/CreatePIN'
import BiometricLogin from 'screens/onboarding/BiometricLogin'
import { createStackNavigator } from '@react-navigation/stack'
import { MainHeaderOptions } from 'navigation/NavUtils'
import { useApplicationContext } from 'contexts/ApplicationContext'
import WarningModal from 'components/WarningModal'
import TermsNConditionsModal from 'components/TermsNConditionsModal'
import { onAppUnlocked, onLogIn } from 'store/app'
import { useDispatch } from 'react-redux'
import {
  RemoveEvents,
  useBeforeRemoveListener
} from 'hooks/useBeforeRemoveListener'
import { usePostCapture } from 'hooks/usePosthogCapture'
import OwlLoader from 'components/OwlLoader'
import { setCoreAnalytics } from 'store/settings/securityPrivacy'
import Logger from 'utils/Logger'
import { CreateWalletScreenProps } from '../types'

export type CreateWalletStackParamList = {
  [AppNavigation.CreateWallet.CreateWallet]: undefined
  [AppNavigation.CreateWallet.ProtectFunds]: undefined
  [AppNavigation.CreateWallet.CheckMnemonic]: undefined
  [AppNavigation.CreateWallet.CreatePin]: undefined
  [AppNavigation.CreateWallet.BiometricLogin]: undefined
  [AppNavigation.CreateWallet.TermsNConditions]: undefined
  [AppNavigation.CreateWallet.Loader]: undefined
}
const CreateWalletS = createStackNavigator<CreateWalletStackParamList>()

type CreateWalletContextState = {
  mnemonic: string
  setMnemonic: Dispatch<string>
}
const CreateWalletContext = createContext({} as CreateWalletContextState)

const CreateWalletStack: () => JSX.Element = () => {
  const [mnemonic, setMnemonic] = useState('')

  return (
    <CreateWalletContext.Provider value={{ setMnemonic, mnemonic }}>
      <CreateWalletS.Navigator screenOptions={{ headerShown: false }}>
        <CreateWalletS.Screen
          options={MainHeaderOptions()}
          name={AppNavigation.CreateWallet.CreateWallet}
          component={CreateWalletScreen}
        />
        <CreateWalletS.Screen
          options={{ presentation: 'transparentModal' }}
          name={AppNavigation.CreateWallet.ProtectFunds}
          component={CreateWalletWarningModal}
        />
        <CreateWalletS.Screen
          options={MainHeaderOptions()}
          name={AppNavigation.CreateWallet.CheckMnemonic}
          component={CheckMnemonicScreen}
        />
        <CreateWalletS.Screen
          options={MainHeaderOptions()}
          name={AppNavigation.CreateWallet.CreatePin}
          component={CreatePinScreen}
        />
        <CreateWalletS.Screen
          options={{ headerShown: true, headerTitle: '' }}
          name={AppNavigation.CreateWallet.BiometricLogin}
          component={BiometricLoginScreen}
        />
        <CreateWalletS.Screen
          options={{ presentation: 'transparentModal' }}
          name={AppNavigation.CreateWallet.TermsNConditions}
          component={TermsNConditionsModalScreen}
        />
        <CreateWalletS.Screen
          name={AppNavigation.CreateWallet.Loader}
          component={OwlLoader}
        />
      </CreateWalletS.Navigator>
    </CreateWalletContext.Provider>
  )
}

type CreateWalletNavigationProp = CreateWalletScreenProps<
  typeof AppNavigation.CreateWallet.CreateWallet
>['navigation']

const CreateWalletScreen = () => {
  const createWalletContext = useContext(CreateWalletContext)
  const { navigate } = useNavigation<CreateWalletNavigationProp>()
  const { capture } = usePostCapture()
  const dispatch = useDispatch()

  useBeforeRemoveListener(
    useCallback(() => {
      capture('OnboardingCancelled')
      dispatch(setCoreAnalytics(undefined))
    }, [capture, dispatch]),
    [RemoveEvents.GO_BACK]
  )

  const onSavedMyPhrase = (mnemonic: string) => {
    createWalletContext.setMnemonic(mnemonic)
    navigate(AppNavigation.CreateWallet.ProtectFunds)
  }

  return <CreateWallet onSavedMyPhrase={onSavedMyPhrase} />
}

type ProtectFundsNavigationProp = CreateWalletScreenProps<
  typeof AppNavigation.CreateWallet.ProtectFunds
>['navigation']

const CreateWalletWarningModal = () => {
  const { navigate, goBack } = useNavigation<ProtectFundsNavigationProp>()
  const { capture } = usePostCapture()

  const onUnderstand = () => {
    capture('OnboardingMnemonicCreated')
    goBack()
    navigate(AppNavigation.CreateWallet.CheckMnemonic)
  }

  const onBack = () => {
    goBack()
  }

  return (
    <WarningModal
      title={'Protect Your Funds'}
      message={
        ' Losing this phrase will result in lost funds. Please be sure to store it in a secure location.'
      }
      actionText={'I understand'}
      dismissText={'Back'}
      onAction={onUnderstand}
      onDismiss={onBack}
      testID="create_wallet_stack__warning_modal"
    />
  )
}

type CheckMnemonicNavigationProp = CreateWalletScreenProps<
  typeof AppNavigation.CreateWallet.CheckMnemonic
>['navigation']

const CheckMnemonicScreen = () => {
  const createWalletContext = useContext(CreateWalletContext)
  const { navigate, goBack } = useNavigation<CheckMnemonicNavigationProp>()
  return (
    <CheckMnemonic
      onSuccess={() => {
        navigate(AppNavigation.CreateWallet.CreatePin)
      }}
      onBack={() => goBack()}
      mnemonic={createWalletContext.mnemonic}
    />
  )
}

type CreatePinNavigationProp = CreateWalletScreenProps<
  typeof AppNavigation.CreateWallet.CreatePin
>['navigation']

const CreatePinScreen = () => {
  const createWalletContext = useContext(CreateWalletContext)
  const walletSetupHook = useApplicationContext().walletSetupHook
  const { navigate } = useNavigation<CreatePinNavigationProp>()
  const { capture } = usePostCapture()

  const onPinSet = (pin: string): void => {
    capture('OnboardingPasswordSet')
    walletSetupHook
      .onPinCreated(createWalletContext.mnemonic, pin, false)
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
      .catch(reason => Logger.error(reason))
  }

  return <CreatePIN onPinSet={onPinSet} />
}

type BiometricLoginNavigationProp = CreateWalletScreenProps<
  typeof AppNavigation.CreateWallet.BiometricLogin
>['navigation']

const BiometricLoginScreen = () => {
  const createWalletContext = useContext(CreateWalletContext)
  const { navigate } = useNavigation<BiometricLoginNavigationProp>()
  return (
    <BiometricLogin
      mnemonic={createWalletContext.mnemonic}
      onBiometrySet={() => {
        navigate(AppNavigation.CreateWallet.TermsNConditions)
      }}
      onSkip={() => navigate(AppNavigation.CreateWallet.TermsNConditions)}
    />
  )
}

const TermsNConditionsModalScreen = () => {
  const createWalletContext = useContext(CreateWalletContext)
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
            .enterWallet(createWalletContext.mnemonic)
            .then(() => {
              dispatch(onLogIn())
              dispatch(onAppUnlocked())
            })
            .catch(reason => Logger.error(reason))
        }, 300)
      }}
      onReject={() => signOut()}
    />
  )
}

export default CreateWalletStack
