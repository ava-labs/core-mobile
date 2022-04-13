import React from 'react'
import AppNavigation from 'navigation/AppNavigation'
import { createStackNavigator } from '@react-navigation/stack'
import SwapView from 'screens/swap/SwapView'
import SwapReview from 'screens/swap/SwapReview'
import DoneScreen from 'screens/swap/DoneScreen'
import FailScreen from 'screens/swap/FailScreen'
import HeaderAccountSelector from 'components/HeaderAccountSelector'
import { SwapContextProvider } from 'contexts/SwapContext'
import EditGasLimitBottomSheet from 'screens/shared/EditGasLimitBottomSheet'

export type SwapStackParamList = {
  [AppNavigation.Swap.Swap]: undefined
  [AppNavigation.Swap.Review]: undefined
  [AppNavigation.Swap.Success]: undefined
  [AppNavigation.Swap.Fail]: { errorMsg: string }
  [AppNavigation.Swap.SwapTransactionFee]: undefined
}

const SwapStack = createStackNavigator<SwapStackParamList>()

function SwapScreenStack() {
  return (
    <SwapContextProvider>
      <SwapStack.Navigator
        screenOptions={{
          presentation: 'card',
          headerShown: true,
          headerBackTitleVisible: false,
          headerTitleAlign: 'center',
          headerTitle: () => <HeaderAccountSelector />
        }}>
        <SwapStack.Screen name={AppNavigation.Swap.Swap} component={SwapView} />
        <SwapStack.Screen
          options={{
            headerTitle: ''
          }}
          name={AppNavigation.Swap.Review}
          component={SwapReview}
        />
        <SwapStack.Screen
          name={AppNavigation.Swap.Success}
          component={DoneScreen}
        />
        <SwapStack.Screen
          name={AppNavigation.Swap.Fail}
          component={FailScreen}
        />
        <SwapStack.Screen
          options={{
            presentation: 'transparentModal',
            transitionSpec: {
              open: { animation: 'timing', config: { duration: 0 } },
              close: { animation: 'timing', config: { duration: 300 } }
            }
          }}
          name={AppNavigation.Swap.SwapTransactionFee}
          component={EditGasLimitBottomSheet}
        />
      </SwapStack.Navigator>
    </SwapContextProvider>
  )
}

export default React.memo(SwapScreenStack)
