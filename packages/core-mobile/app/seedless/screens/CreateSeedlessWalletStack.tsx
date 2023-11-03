import AppNavigation from 'navigation/AppNavigation'
import React, { createContext, Dispatch, FC, useState } from 'react'
import { useRoute } from '@react-navigation/native'
import CreatePIN from 'screens/onboarding/CreatePIN'
import { createStackNavigator } from '@react-navigation/stack'
import { MainHeaderOptions } from 'navigation/NavUtils'
import { SignerSessionData } from '@cubist-dev/cubesigner-sdk'

export type CreateSeedlessWalletStackParamList = {
  [AppNavigation.CreateSeedlessWallet.CreatePin]: undefined
  [AppNavigation.CreateSeedlessWallet.BiometricLogin]: undefined
  [AppNavigation.CreateSeedlessWallet.TermsNConditions]: undefined
  [AppNavigation.CreateSeedlessWallet.Loader]: undefined
}
const CreateSeedlessWalletS =
  createStackNavigator<CreateSeedlessWalletStackParamList>()

type CreateSeedlessWalletContextState = {
  signerSessionData: SignerSessionData
  setSignerSessionData: Dispatch<SignerSessionData>
}
const CreateSeedlessWalletContext = createContext(
  {} as CreateSeedlessWalletContextState
)

const CreateSeedlessWalletStack: () => JSX.Element = () => {
  const { params } = useRoute()

  const [signerSessionData, setSignerSessionData] = useState<SignerSessionData>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (params as any)?.signerSessionData
  )

  //   console.log('====================================================')
  //   console.log('Cubist SignerSessionData:', signerSessionData)
  //   console.log('====================================================')

  return (
    <CreateSeedlessWalletContext.Provider
      value={{ setSignerSessionData, signerSessionData }}>
      <CreateSeedlessWalletS.Navigator screenOptions={{ headerShown: false }}>
        <CreateSeedlessWalletS.Screen
          options={MainHeaderOptions()}
          name={AppNavigation.CreateSeedlessWallet.CreatePin}
          component={CreatePinScreen}
        />
        {/* <CreateSeedlessWalletS.Screen
          options={{ headerShown: true, headerTitle: '' }}
          name={AppNavigation.CreateSeedlessWallet.BiometricLogin}
          component={BiometricLoginScreen}
        />
        <CreateSeedlessWalletS.Screen
          options={{ presentation: 'transparentModal' }}
          name={AppNavigation.CreateSeedlessWallet.TermsNConditions}
          component={TermsNConditionsModalScreen}
        />
        <CreateSeedlessWalletS.Screen
          name={AppNavigation.CreateSeedlessWallet.Loader}
          component={OwlLoader}
        /> */}
      </CreateSeedlessWalletS.Navigator>
    </CreateSeedlessWalletContext.Provider>
  )
}

// type CreatePinNavigationProp = CreateSeedlessWalletScreenProps<
//   typeof AppNavigation.CreateSeedlessWallet.CreatePin
// >['navigation']

const CreatePinScreen: FC = () => {
  //   const context = useContext(CreateSeedlessWalletContext)
  //   const walletSetupHook = useApplicationContext().walletSetupHook
  //   const { navigate } = useNavigation<CreatePinNavigationProp>()
  //   const { capture } = usePostCapture()

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const onPinSet = (pin: string): void => {
    // capture('OnboardingPasswordSet')
    // walletSetupHook
    //   .onPinCreated(context.mnemonic, pin, false)
    //   .then(value => {
    //     switch (value) {
    //       case 'useBiometry':
    //         navigate(AppNavigation.CreateSeedlessWallet.BiometricLogin)
    //         break
    //       case 'enterWallet':
    //         navigate(AppNavigation.CreateSeedlessWallet.TermsNConditions)
    //         break
    //     }
    //   })
    //   .catch(Logger.error)
  }

  return <CreatePIN onPinSet={onPinSet} />
}

// type BiometricLoginNavigationProp = CreateSeedlessWalletScreenProps<
//   typeof AppNavigation.CreateSeedlessWallet.BiometricLogin
// >['navigation']

// const BiometricLoginScreen = () => {
//   const context = useContext(CreateSeedlessWalletContext)
//   const { navigate } = useNavigation<BiometricLoginNavigationProp>()
//   return (
//     <BiometricLogin
//       mnemonic={context.mnemonic}
//       onBiometrySet={() => {
//         navigate(AppNavigation.CreateSeedlessWallet.TermsNConditions)
//       }}
//       onSkip={() =>
//         navigate(AppNavigation.CreateSeedlessWallet.TermsNConditions)
//       }
//     />
//   )
// }

// const TermsNConditionsModalScreen = () => {
//   const context = useContext(CreateSeedlessWalletContext)
//   const walletSetupHook = useApplicationContext().walletSetupHook
//   const { signOut } = useApplicationContext().appHook
//   const dispatch = useDispatch()
//   const { navigate } = useNavigation<BiometricLoginNavigationProp>()

//   return (
//     <TermsNConditionsModal
//       onNext={() => {
//         navigate(AppNavigation.CreateSeedlessWallet.Loader)
//         setTimeout(() => {
//           // signing in with a brand new wallet
//           walletSetupHook
//             .enterWallet(context.mnemonic)
//             .then(() => {
//               dispatch(onLogIn())
//               dispatch(onAppUnlocked())
//             })
//             .catch(Logger.error)
//         }, 300)
//       }}
//       onReject={() => signOut()}
//     />
//   )
// }

export default CreateSeedlessWalletStack
