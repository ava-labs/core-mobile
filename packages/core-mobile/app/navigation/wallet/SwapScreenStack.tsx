import React from 'react'
import AppNavigation from 'navigation/AppNavigation'
import { createStackNavigator } from '@react-navigation/stack'
import SwapView from 'screens/swap/SwapView'
import SwapReview from 'screens/swap/SwapReview'
import HeaderAccountSelector from 'components/HeaderAccountSelector'
import { SwapContextProvider } from 'contexts/SwapContext'
import { usePosthogContext } from 'contexts/PosthogContext'
import { useNavigation } from '@react-navigation/native'
import FeatureBlocked from 'screens/posthog/FeatureBlocked'
import { SwapScreenProps } from '../types'

export type SwapStackParamList = {
  [AppNavigation.Swap.Swap]: undefined
  [AppNavigation.Swap.Review]: undefined
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
  const navigation = useNavigation<SwapNav>()
  const onBackToParent = () => {
    navigation.getParent()?.goBack()
  }
  return (
    <SwapReview onCancel={navigation.goBack} onBackToParent={onBackToParent} />
  )
}

export default React.memo(SwapScreenStack)
