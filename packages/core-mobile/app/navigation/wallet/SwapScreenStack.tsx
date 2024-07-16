import React from 'react'
import AppNavigation from 'navigation/AppNavigation'
import { createStackNavigator } from '@react-navigation/stack'
import { useSelector } from 'react-redux'
import { selectIsSwapBlocked } from 'store/posthog'
import SwapView from 'screens/swap/SwapView'
import HeaderAccountSelector from 'components/HeaderAccountSelector'
import { SwapContextProvider } from 'contexts/SwapContext/SwapContext'
import { useNavigation } from '@react-navigation/native'
import FeatureBlocked from 'screens/posthog/FeatureBlocked'
import * as Navigation from 'utils/Navigation'

export type SwapStackParamList = {
  [AppNavigation.Swap.Swap]: { initialTokenId: string } | undefined
}

const SwapStack = createStackNavigator<SwapStackParamList>()

const HeaderTitle = (): JSX.Element => {
  return (
    <HeaderAccountSelector
      direction="down"
      onPressed={() =>
        Navigation.navigate({
          name: AppNavigation.Root.Wallet,
          params: { screen: AppNavigation.Modal.AccountDropDown }
        })
      }
    />
  )
}

function SwapScreenStack(): JSX.Element {
  const isSwapBlocked = useSelector(selectIsSwapBlocked)
  const { goBack } = useNavigation()

  return (
    <SwapContextProvider>
      <SwapStack.Navigator
        screenOptions={{
          presentation: 'card',
          headerShown: true,
          headerBackTitleVisible: false,
          headerTitleAlign: 'center',
          headerTitle: HeaderTitle
        }}>
        <SwapStack.Screen name={AppNavigation.Swap.Swap} component={SwapView} />
      </SwapStack.Navigator>
      {isSwapBlocked && (
        <FeatureBlocked
          onOk={goBack}
          message={
            'Swap is currently under maintenance. Service will resume shortly.'
          }
        />
      )}
    </SwapContextProvider>
  )
}

export default React.memo(SwapScreenStack)
