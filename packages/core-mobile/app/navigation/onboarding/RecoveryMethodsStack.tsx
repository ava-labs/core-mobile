import AppNavigation from 'navigation/AppNavigation'
import React, {
  createContext,
  useContext,
  useLayoutEffect,
  useState
} from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { AuthenticatorSetup } from 'seedless/screens/AuthenticatorSetup'
import { ScanQrCode } from 'seedless/screens/ScanQrCode'
import { LearnMore } from 'seedless/screens/LearnMore'
import { VerifyCode } from 'seedless/screens/VerifyCode'
import { MainHeaderOptions } from 'navigation/NavUtils'
import { AddRecoveryMethods } from 'seedless/screens/AddRecoveryMethods'
import { useRoute } from '@react-navigation/native'
import { OnboardScreenProps } from 'navigation/types'
import { SelectRecoveryMethods } from 'seedless/screens/SelectRecoveryMethods'
import { MFA } from 'seedless/types'
import { FIDONameInputScreen } from 'seedless/screens/FIDONameInputScreen'
import { useNavigation } from '@react-navigation/native'
import { RecoveryMethodsScreenProps } from 'navigation/types'
import { usePostCapture } from 'hooks/usePosthogCapture'

export type RecoveryMethodsStackParamList = {
  [AppNavigation.RecoveryMethods.AddRecoveryMethods]: undefined
  [AppNavigation.RecoveryMethods.SelectRecoveryMethods]: { mfaMethods: MFA[] }
  [AppNavigation.RecoveryMethods.AuthenticatorSetup]: undefined
  [AppNavigation.RecoveryMethods.ScanQrCode]: undefined
  [AppNavigation.RecoveryMethods.LearnMore]: { totpCode?: string }
  [AppNavigation.RecoveryMethods.VerifyCode]: undefined
  [AppNavigation.RecoveryMethods.FIDONameInput]: {
    title: string
    description: string
    inputFieldLabel: string
    inputFieldPlaceholder: string
    onClose: (name?: string) => Promise<void>
  }
}

const RecoveryMethodsS = createStackNavigator<RecoveryMethodsStackParamList>()

type RecoveryMethodsContextState = {
  oidcToken: string
  mfaId: string
}

export const RecoveryMethodsContext = createContext(
  {} as RecoveryMethodsContextState
)

type RecoveryMethodsStackProps = OnboardScreenProps<
  typeof AppNavigation.Onboard.RecoveryMethods
>

const RecoveryMethodsStack = (): JSX.Element => {
  const { params } = useRoute<RecoveryMethodsStackProps['route']>()
  const [oidcToken] = useState(params.oidcToken)
  const [mfaId] = useState(params.mfaId)

  return (
    <RecoveryMethodsContext.Provider value={{ oidcToken, mfaId }}>
      <RecoveryMethodsS.Navigator>
        <RecoveryMethodsS.Screen
          options={MainHeaderOptions()}
          name={AppNavigation.RecoveryMethods.AddRecoveryMethods}
          component={AddRecoveryMethods}
        />
        <RecoveryMethodsS.Screen
          options={MainHeaderOptions()}
          name={AppNavigation.RecoveryMethods.SelectRecoveryMethods}
          component={SelectRecoveryMethods}
        />
        <RecoveryMethodsS.Group>
          {/* Screens for authenticator setup */}
          <RecoveryMethodsS.Screen
            options={MainHeaderOptions()}
            name={AppNavigation.RecoveryMethods.AuthenticatorSetup}
            component={AuthenticatorSetup}
          />
          <RecoveryMethodsS.Screen
            options={MainHeaderOptions()}
            name={AppNavigation.RecoveryMethods.ScanQrCode}
            component={ScanQrCode}
          />
          <RecoveryMethodsS.Screen
            options={MainHeaderOptions()}
            name={AppNavigation.RecoveryMethods.LearnMore}
            component={LearnMore}
          />
          <RecoveryMethodsS.Screen
            options={{ presentation: 'transparentModal' }}
            name={AppNavigation.RecoveryMethods.VerifyCode}
            component={VerifyCodeScreen}
          />
        </RecoveryMethodsS.Group>
        <RecoveryMethodsS.Group>
          <RecoveryMethodsS.Screen
            options={{ presentation: 'modal' }}
            name={AppNavigation.RecoveryMethods.FIDONameInput}
            component={FIDONameInputScreen}
          />
        </RecoveryMethodsS.Group>
      </RecoveryMethodsS.Navigator>
    </RecoveryMethodsContext.Provider>
  )
}

type VerifyCodeScreenProps = RecoveryMethodsScreenProps<
  typeof AppNavigation.RecoveryMethods.LearnMore
>
function VerifyCodeScreen(): JSX.Element {
  const { oidcToken, mfaId } = useContext(RecoveryMethodsContext)
  const { canGoBack, goBack, replace, setOptions } =
    useNavigation<VerifyCodeScreenProps['navigation']>()
  const { capture } = usePostCapture()

  const handleVerifySuccess = (): void => {
    replace(AppNavigation.Onboard.NameYourWallet)

    capture('SeedlessMfaVerified', { type: 'Authenticator' })
  }

  useLayoutEffect(() => {
    setOptions({
      headerShown: false
    })
  }, [setOptions])

  const handleOnBack = (): void => {
    if (canGoBack()) {
      goBack()
    }
  }
  return (
    <VerifyCode
      onVerifySuccess={handleVerifySuccess}
      onBack={handleOnBack}
      oidcToken={oidcToken}
      mfaId={mfaId}
    />
  )
}
export default RecoveryMethodsStack
