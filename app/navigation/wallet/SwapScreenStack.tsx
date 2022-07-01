import React from 'react'
import AppNavigation from 'navigation/AppNavigation'
import { createStackNavigator } from '@react-navigation/stack'
import SwapView from 'screens/swap/SwapView'
import SwapReview from 'screens/swap/SwapReview'
import DoneScreen from 'screens/swap/DoneScreen'
import FailScreen from 'screens/swap/FailScreen'
import HeaderAccountSelector from 'components/HeaderAccountSelector'
import { SwapContextProvider } from 'contexts/SwapContext'
import SwapTransactionFee from 'screens/swap/SwapTransactionFee'
import { usePosthogContext } from 'contexts/PosthogContext'
import { useNavigation } from '@react-navigation/native'
import FeatureBlocked from 'screens/posthog/FeatureBlocked'
import PendingScreen from 'screens/swap/PendingScreen'
import { useRoute } from '@react-navigation/core'
import { EditGasLimitParams, SwapScreenProps } from '../types'

export type SwapStackParamList = {
  [AppNavigation.Swap.Swap]: undefined
  [AppNavigation.Swap.Review]: undefined
  [AppNavigation.Swap.Pending]: undefined
  [AppNavigation.Swap.Success]: undefined
  [AppNavigation.Swap.Fail]: { errorMsg: string }
  [AppNavigation.Swap.SwapTransactionFee]: EditGasLimitParams
}

const SwapStack = createStackNavigator<SwapStackParamList>()

function SwapScreenStack() {
  const { swapBlocked } = usePosthogContext()
  const { goBack } = useNavigation()

  return (
    <SwapContextProvider>
      <SwapStack.Navigator
        screenOptions={{
          presentation: 'card',
          headerShown: true,
          headerBackTitleVisible: false,
          headerTitleAlign: 'center',
          headerTitle: () => <HeaderAccountSelector direction="down" />
        }}>
        <SwapStack.Screen name={AppNavigation.Swap.Swap} component={SwapView} />
        <SwapStack.Screen
          options={{
            headerTitle: ''
          }}
          name={AppNavigation.Swap.Review}
          component={SwapReviewComp}
        />
        <SwapStack.Screen
          options={{ headerShown: false }}
          name={AppNavigation.Swap.Pending}
          component={PendingScreenComp}
        />
        <SwapStack.Screen
          name={AppNavigation.Swap.Success}
          component={DoneScreenComp}
        />
        <SwapStack.Screen
          name={AppNavigation.Swap.Fail}
          component={FailScreenComp}
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
          component={SwapTransactionFee}
        />
      </SwapStack.Navigator>
      {swapBlocked && (
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

type SwapNav = SwapScreenProps<typeof AppNavigation.Swap.Swap>['navigation']

function SwapReviewComp() {
  const { navigate, goBack } = useNavigation<SwapNav>()
  const startSwap = () => {
    goBack() //remove pending screen
    navigate(AppNavigation.Swap.Pending)
  }
  return <SwapReview onCancel={goBack} onConfirm={startSwap} />
}

function PendingScreenComp() {
  const { navigate, goBack } = useNavigation<SwapNav>()
  const showSuccess = () => {
    goBack() //remove review screen
    navigate(AppNavigation.Swap.Success)
  }
  const showFail = (errMsg: string) => {
    goBack() //remove pending screen
    navigate(AppNavigation.Swap.Fail, { errorMsg: errMsg })
  }
  return <PendingScreen onSuccess={showSuccess} onFail={showFail} />
}

function DoneScreenComp() {
  const { goBack } = useNavigation<SwapNav>()
  const dismissSwap = () => {
    goBack()
    goBack()
  }
  return <DoneScreen onOk={dismissSwap} />
}

type FailRoute = SwapScreenProps<typeof AppNavigation.Swap.Fail>['route']

function FailScreenComp() {
  const { goBack } = useNavigation<SwapNav>()
  const { errorMsg } = useRoute<FailRoute>().params
  const goBackToSwap = () => {
    goBack()
  }
  return <FailScreen onOk={goBackToSwap} errMsg={errorMsg} />
}

export default React.memo(SwapScreenStack)
