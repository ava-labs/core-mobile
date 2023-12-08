import React, { FC } from 'react'
import AppNavigation from 'navigation/AppNavigation'
import { createStackNavigator } from '@react-navigation/stack'
import OwlLoader from 'components/OwlLoader'
import { useNavigation, useRoute } from '@react-navigation/native'
import SessionTimeout, {
  SessionTimeoutParams
} from 'seedless/screens/SessionTimeout'
import { VerifyCode, VerifyCodeParams } from 'seedless/screens/VerifyCode'
import { useTheme } from '@avalabs/k2-mobile'
import { RefreshTokenScreenProps } from 'navigation/types'
import WrongSocialAccount, {
  WrongSocialAccountParams
} from 'seedless/screens/WrongSocialAccount'

export type RefreshTokenScreenStackParamList = {
  [AppNavigation.RefreshToken.OwlLoader]: undefined
  [AppNavigation.RefreshToken.SessionTimeout]: SessionTimeoutParams
  [AppNavigation.RefreshToken.WrongSocialAccount]: WrongSocialAccountParams
  [AppNavigation.RefreshToken.VerifyCode]: VerifyCodeParams
}

const RefreshTokenScreenS =
  createStackNavigator<RefreshTokenScreenStackParamList>()

const RefreshTokenScreenStack: FC = () => {
  const { theme } = useTheme()

  return (
    <RefreshTokenScreenS.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: theme.colors.$black }
      }}>
      <RefreshTokenScreenS.Screen
        name={AppNavigation.RefreshToken.OwlLoader}
        component={OwlLoader}
      />
      <RefreshTokenScreenS.Screen
        options={{ presentation: 'transparentModal' }}
        name={AppNavigation.RefreshToken.SessionTimeout}
        component={SessionTimeoutScreen}
      />
      <RefreshTokenScreenS.Screen
        options={{ presentation: 'transparentModal' }}
        name={AppNavigation.RefreshToken.WrongSocialAccount}
        component={WrongSocialAccountScreen}
      />
      <RefreshTokenScreenS.Screen
        options={{ presentation: 'modal' }}
        name={AppNavigation.RefreshToken.VerifyCode}
        component={VerifyCodeScreen}
      />
    </RefreshTokenScreenS.Navigator>
  )
}

type SessionTimeoutScreenProps = RefreshTokenScreenProps<
  typeof AppNavigation.RefreshToken.SessionTimeout
>

function SessionTimeoutScreen(): JSX.Element {
  const { params } = useRoute<SessionTimeoutScreenProps['route']>()
  return <SessionTimeout onRetry={params.onRetry} />
}

type WrongSocialAccountScreenProps = RefreshTokenScreenProps<
  typeof AppNavigation.RefreshToken.WrongSocialAccount
>

function WrongSocialAccountScreen(): JSX.Element {
  const { params } = useRoute<WrongSocialAccountScreenProps['route']>()
  return <WrongSocialAccount onRetry={params.onRetry} />
}

type VerifyCodeScreenProps = RefreshTokenScreenProps<
  typeof AppNavigation.RefreshToken.VerifyCode
>

function VerifyCodeScreen(): JSX.Element {
  const { goBack } = useNavigation<VerifyCodeScreenProps['navigation']>()
  const { params } = useRoute<VerifyCodeScreenProps['route']>()

  function handleOnVerifySuccess(): void {
    params.onVerifySuccess()
    goBack()
  }

  function handleOnBack(): void {
    params.onBack()
    goBack()
  }

  return (
    <VerifyCode
      onVerifySuccess={handleOnVerifySuccess}
      onBack={handleOnBack}
      oidcToken={params.oidcToken}
      mfaId={params.mfaId}
      exportInitResponse={params.exportInitResponse}
    />
  )
}

export default RefreshTokenScreenStack
