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
import { getModalOptions, MainHeaderOptions } from 'navigation/NavUtils'
import { useApplicationContext } from 'contexts/ApplicationContext'
import WarningModal from 'components/WarningModal'
import TermsNConditionsModal from 'components/TermsNConditionsModal'
import { useDispatch } from 'react-redux'
import {
  RemoveEvents,
  useBeforeRemoveListener
} from 'hooks/useBeforeRemoveListener'
import { setCoreAnalytics } from 'store/settings/securityPrivacy'
import Logger from 'utils/Logger'
import { WalletType } from 'services/wallet/types'
import { useWallet } from 'hooks/useWallet'
import { NameYourWallet } from 'seedless/screens/NameYourWallet'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { setWalletName } from 'store/account'
import LogoLoader from 'components/LogoLoader'
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
          options={{ ...getModalOptions() }}
          name={AppNavigation.CreateWallet.TermsNConditions}
          component={TermsNConditionsModalScreen}
        />
        <CreateWalletS.Screen
          name={AppNavigation.CreateWallet.Loader}
          component={LogoLoader}
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
  const dispatch = useDispatch()

  useBeforeRemoveListener(
    useCallback(() => {
      AnalyticsService.capture('OnboardingCancelled')
      dispatch(setCoreAnalytics(undefined))
    }, [dispatch]),
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

  const onUnderstand = (): void => {
    AnalyticsService.capture('OnboardingMnemonicCreated')
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
  const dispatch = useDispatch()
  const { navigate } = useNavigation<NameYourWalletNavigationProp>()

  const onSetWalletName = (name: string): void => {
    AnalyticsService.capture('CreateWallet:WalletNameSet')
    dispatch(setWalletName(name))
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

  const onPinSet = (pin: string): void => {
    AnalyticsService.capture('OnboardingPasswordSet')
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
  const { login } = useWallet()
  const { signOut } = useApplicationContext().appHook
  const { navigate } = useNavigation<BiometricLoginNavigationProp>()

  return (
    <TermsNConditionsModal
      onNext={() => {
        navigate(AppNavigation.CreateWallet.Loader)
        setTimeout(() => {
          // creating a brand new mnemonic wallet
          login(createWalletContext.mnemonic, WalletType.MNEMONIC)
        }, 300)
      }}
      onReject={() => signOut()}
    />
  )
}

export default CreateWalletStack
