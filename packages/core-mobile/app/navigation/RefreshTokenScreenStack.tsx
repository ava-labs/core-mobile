import React, { FC } from 'react'
import AppNavigation from 'navigation/AppNavigation'
import { createStackNavigator } from '@react-navigation/stack'
import { useRoute } from '@react-navigation/native'

import SessionTimeout, {
  SessionTimeoutParams
} from 'seedless/screens/SessionTimeout'
import { useTheme } from '@avalabs/k2-mobile'
import { RefreshTokenScreenProps } from 'navigation/types'
import WrongSocialAccount, {
  WrongSocialAccountParams
} from 'seedless/screens/WrongSocialAccount'
import LogoLoader from 'components/LogoLoader'

export type RefreshTokenScreenStackParamList = {
  [AppNavigation.RefreshToken.LogoLoader]: undefined
  [AppNavigation.RefreshToken.SessionTimeout]: SessionTimeoutParams
  [AppNavigation.RefreshToken.WrongSocialAccount]: WrongSocialAccountParams
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
        name={AppNavigation.RefreshToken.LogoLoader}
        component={LogoLoader}
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

export default RefreshTokenScreenStack
