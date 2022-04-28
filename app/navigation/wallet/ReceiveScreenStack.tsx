import React from 'react'
import { useApplicationContext } from 'contexts/ApplicationContext'
import {
  createStackNavigator,
  TransitionPresets
} from '@react-navigation/stack'
import { useNavigation } from '@react-navigation/native'
import HeaderAccountSelector from 'components/HeaderAccountSelector'
import AppNavigation from 'navigation/AppNavigation'
import { ReceiveTokensScreenProps } from 'navigation/types'
import ReceiveToken2 from 'screens/receive/ReceiveToken2'

export type ReceiveStackParamList = {
  [AppNavigation.ReceiveTokens.ReceiveCChain]: undefined
}

const ReceiveStack = createStackNavigator<ReceiveStackParamList>()

const ReceiveScreenStack = () => {
  const { theme } = useApplicationContext()

  const receiveNavigator = (
    <ReceiveStack.Navigator
      screenOptions={{
        presentation: 'card',
        headerBackTitleVisible: false,
        headerTitleAlign: 'center',
        headerStyle: {
          elevation: 0,
          shadowOpacity: 0,
          backgroundColor: theme.background
        },
        ...TransitionPresets.SlideFromRightIOS
      }}>
      <ReceiveStack.Screen
        name={AppNavigation.ReceiveTokens.ReceiveCChain}
        options={{
          headerTitle: () => <HeaderAccountSelectorComp />
        }}
        component={ReceiveTokenScreen}
      />
    </ReceiveStack.Navigator>
  )

  return receiveNavigator
}

type HeaderAccountSelectorNavigationProp = ReceiveTokensScreenProps<
  typeof AppNavigation.ReceiveTokens.ReceiveCChain
>['navigation']

const HeaderAccountSelectorComp = () => {
  const { navigate } = useNavigation<HeaderAccountSelectorNavigationProp>()

  return (
    <HeaderAccountSelector
      onPressed={() => navigate(AppNavigation.Modal.AccountDropDown)}
    />
  )
}

const ReceiveTokenScreen = () => <ReceiveToken2 embedded={false} />

export default ReceiveScreenStack
