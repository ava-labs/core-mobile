import React from 'react'
import { View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import {
  createStackNavigator,
  TransitionPresets
} from '@react-navigation/stack'
import { HeaderBackButton } from '@react-navigation/elements'
import { useNavigation } from '@react-navigation/native'
import HeaderAccountSelector from 'components/HeaderAccountSelector'
import AppNavigation from 'navigation/AppNavigation'
import { ReceiveTokensScreenProps } from 'navigation/types'
import ReceiveToken2 from 'screens/receive/ReceiveToken2'
import NetworkDropdown from 'screens/network/NetworkDropdown'

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
          header: () => <HeaderAccountSelectorComp />
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
  const { navigate, goBack } =
    useNavigation<HeaderAccountSelectorNavigationProp>()

  return (
    <View
      style={{
        flexDirection: 'row',
        paddingLeft: 8,
        paddingRight: 16,
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
      <HeaderBackButton onPress={goBack} />
      <View style={{ zIndex: 1 }}>
        <HeaderAccountSelector
          onPressed={() => navigate(AppNavigation.Modal.AccountDropDown)}
        />
      </View>
      <NetworkDropdown />
    </View>
  )
}

const ReceiveTokenScreen = () => <ReceiveToken2 embedded={false} />

export default ReceiveScreenStack
