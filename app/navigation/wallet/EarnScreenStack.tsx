import React, { useEffect } from 'react'
import AppNavigation from 'navigation/AppNavigation'
import { createStackNavigator } from '@react-navigation/stack'
import GetStarted from 'screens/earn/GetStarted'
import StakingAmount from 'screens/earn/StakingAmount'
import { EarnScreenProps } from 'navigation/types'
import { useNavigation } from '@react-navigation/native'
import NotEnoughAvax from 'screens/earn/NotEnoughAvax'
import useStakingParams from 'hooks/useStakingParams'

export type EarnStackParamList = {
  [AppNavigation.Earn.NotEnoughAvax]: undefined
  [AppNavigation.Earn.GetStarted]: undefined
  [AppNavigation.Earn.StakingAmount]: undefined
}

const EarnStack = createStackNavigator<EarnStackParamList>()

function EarnScreenStack() {
  return (
    <EarnStack.Navigator
      screenOptions={{
        presentation: 'card',
        headerShown: true,
        title: '',
        headerBackTitleVisible: false,
        headerTitleAlign: 'center'
      }}>
      <EarnStack.Screen
        name={AppNavigation.Earn.NotEnoughAvax}
        component={NotEnoughAvaxScreen}
      />
      <EarnStack.Screen
        name={AppNavigation.Earn.GetStarted}
        component={EarnGetStartedScreen}
      />
      <EarnStack.Screen
        name={AppNavigation.Earn.StakingAmount}
        component={StakingAmount}
      />
    </EarnStack.Navigator>
  )
}

type EarnProps = EarnScreenProps<typeof AppNavigation.Earn.GetStarted>

const EarnGetStartedScreen = () => {
  const { navigate, replace } = useNavigation<EarnProps['navigation']>()
  const { nativeTokenBalance, minStakeAmount } = useStakingParams()

  useEffect(() => {
    if (nativeTokenBalance && nativeTokenBalance.lt(minStakeAmount)) {
      replace(AppNavigation.Earn.NotEnoughAvax)
    }
  }, [minStakeAmount, nativeTokenBalance, replace])

  const navToStakingAmount = () => {
    navigate(AppNavigation.Earn.StakingAmount)
  }
  return <GetStarted onNext={navToStakingAmount} />
}

const NotEnoughAvaxScreen = () => {
  const { navigate, replace } = useNavigation<EarnProps['navigation']>()
  const { nativeTokenBalance, minStakeAmount } = useStakingParams()

  useEffect(() => {
    if (nativeTokenBalance && nativeTokenBalance.gte(minStakeAmount)) {
      replace(AppNavigation.Earn.GetStarted)
    }
  }, [minStakeAmount, nativeTokenBalance, replace])
  const navToBuy = () => {
    navigate(AppNavigation.Wallet.Buy)
  }
  const navToReceive = () => {
    navigate(AppNavigation.Wallet.ReceiveTokens)
  }
  const navToSwap = () => {
    navigate(AppNavigation.Wallet.Swap)
  }
  return (
    <NotEnoughAvax
      onBuyAvax={navToBuy}
      onReceive={navToReceive}
      onSwap={navToSwap}
    />
  )
}

export default React.memo(EarnScreenStack)
