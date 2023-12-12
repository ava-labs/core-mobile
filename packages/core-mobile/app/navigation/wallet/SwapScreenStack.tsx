import React from 'react'
import AppNavigation from 'navigation/AppNavigation'
import { createStackNavigator } from '@react-navigation/stack'
import { useSelector } from 'react-redux'
import { selectIsSwapBlocked } from 'store/posthog'
import SwapView from 'screens/swap/SwapView'
import SwapReview from 'screens/swap/SwapReview'
import HeaderAccountSelector from 'components/HeaderAccountSelector'
import { SwapContextProvider } from 'contexts/SwapContext'
import { useNavigation } from '@react-navigation/native'
import FeatureBlocked from 'screens/posthog/FeatureBlocked'
import * as Navigation from 'utils/Navigation'
import { SwapScreenProps } from '../types'

export type SwapStackParamList = {
  [AppNavigation.Swap.Swap]: undefined
  [AppNavigation.Swap.Review]: undefined
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
        <SwapStack.Screen
          options={{
            headerTitle: ''
          }}
          name={AppNavigation.Swap.Review}
          component={SwapReviewComp}
        />
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

type SwapNav = SwapScreenProps<typeof AppNavigation.Swap.Swap>['navigation']

function SwapReviewComp(): JSX.Element {
  const navigation = useNavigation<SwapNav>()
  const onBackToParent = (): void => {
    navigation.getParent()?.goBack()
  }
  return (
    <SwapReview onCancel={navigation.goBack} onBackToParent={onBackToParent} />
  )
}

export default React.memo(SwapScreenStack)
