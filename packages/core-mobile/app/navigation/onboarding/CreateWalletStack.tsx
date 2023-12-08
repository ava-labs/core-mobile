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
import { useDispatch } from 'react-redux'
import {
  RemoveEvents,
  useBeforeRemoveListener
} from 'hooks/useBeforeRemoveListener'
import { usePostCapture } from 'hooks/usePosthogCapture'
import OwlLoader from 'components/OwlLoader'
import { setCoreAnalytics } from 'store/settings/securityPrivacy'
import Logger from 'utils/Logger'
import { WalletType } from 'services/wallet/types'
import { useWallet } from 'hooks/useWallet'
import { NameYourWallet } from 'seedless/screens/NameYourWallet'
import { CreateWalletScreenProps } from '../types'

export type CreateWalletStackParamList = {
  [AppNavigation.CreateWallet.CreateWallet]: undefined
  [AppNavigation.CreateWallet.ProtectFunds]: undefined
  [AppNavigation.CreateWallet.CheckMnemonic]: undefined
  [AppNavigation.CreateWallet.NameYourWallet]: undefined
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
          name={AppNavigation.CreateWallet.NameYourWallet}
          component={NameYourWalletScreen}
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

const CreateWalletScreen = (): JSX.Element => {
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

  const onSavedMyPhrase = (mnemonic: string): void => {
    createWalletContext.setMnemonic(mnemonic)
    navigate(AppNavigation.CreateWallet.ProtectFunds)
  }

  return <CreateWallet onSavedMyPhrase={onSavedMyPhrase} />
}

type ProtectFundsNavigationProp = CreateWalletScreenProps<
  typeof AppNavigation.CreateWallet.ProtectFunds
>['navigation']

const CreateWalletWarningModal = (): JSX.Element => {
  const { navigate, goBack } = useNavigation<ProtectFundsNavigationProp>()
  const { capture } = usePostCapture()

  const onUnderstand = (): void => {
    capture('OnboardingMnemonicCreated')
    goBack()
    navigate(AppNavigation.CreateWallet.CheckMnemonic)
  }

  const onBack = (): void => {
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

const CheckMnemonicScreen = (): JSX.Element => {
  const createWalletContext = useContext(CreateWalletContext)
  const { navigate, goBack } = useNavigation<CheckMnemonicNavigationProp>()
  return (
    <CheckMnemonic
      onSuccess={() => {
        navigate(AppNavigation.CreateWallet.NameYourWallet)
      }}
      onBack={() => goBack()}
      mnemonic={createWalletContext.mnemonic}
    />
  )
}

type NameYourWalletNavigationProp = CreateWalletScreenProps<
  typeof AppNavigation.CreateWallet.NameYourWallet
>['navigation']

const NameYourWalletScreen = (): JSX.Element => {
  const { navigate } = useNavigation<NameYourWalletNavigationProp>()
  const { capture } = usePostCapture()

  const onSetWalletName = (): void => {
    capture('CreateWallet:WalletNameSet')
    navigate(AppNavigation.CreateWallet.CreatePin)
  }
  return <NameYourWallet onSetWalletName={onSetWalletName} />
}

type CreatePinNavigationProp = CreateWalletScreenProps<
  typeof AppNavigation.CreateWallet.CreatePin
>['navigation']

const CreatePinScreen = (): JSX.Element => {
  const createWalletContext = useContext(CreateWalletContext)
  const { onPinCreated } = useWallet()
  const { navigate } = useNavigation<CreatePinNavigationProp>()
  const { capture } = usePostCapture()

  const onPinSet = (pin: string): void => {
    capture('OnboardingPasswordSet')
    onPinCreated(createWalletContext.mnemonic, pin, false)
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

const TermsNConditionsModalScreen = (): JSX.Element => {
  const createWalletContext = useContext(CreateWalletContext)
  const { initAndLoginWallet } = useWallet()
  const { signOut } = useApplicationContext().appHook
  const { navigate } = useNavigation<BiometricLoginNavigationProp>()

  return (
    <TermsNConditionsModal
      onNext={() => {
        navigate(AppNavigation.CreateWallet.Loader)
        setTimeout(() => {
          // creating a brand new mnemonic wallet
          initAndLoginWallet(createWalletContext.mnemonic, WalletType.MNEMONIC)
        }, 300)
      }}
      onReject={() => signOut()}
    />
  )
}

export default CreateWalletStack
