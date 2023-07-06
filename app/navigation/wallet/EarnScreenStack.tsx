import React, { useEffect } from 'react'
import { HeaderBackButton } from '@react-navigation/elements'
import AppNavigation from 'navigation/AppNavigation'
import { createStackNavigator } from '@react-navigation/stack'
import GetStarted from 'screens/earn/GetStarted'
import StakingAmount from 'screens/earn/StakingAmount'
import { EarnScreenProps } from 'navigation/types'
import { useNavigation } from '@react-navigation/native'
import StakingDuration from 'screens/earn/DurationScreen'
import { NodeSearch } from 'screens/earn/NodeSearch'
import AdvancedStaking from 'screens/earn/AdvancedStaking'
import SelectNode, { NodeValidator } from 'screens/earn/SelectNode'
import { Confirmation } from 'screens/earn/Confirmation'
import { CancelModal } from 'screens/earn/CancelModal'
import NotEnoughAvax from 'screens/earn/NotEnoughAvax'
import useStakingParams from 'hooks/useStakingParams'
import BN from 'bn.js'

export type EarnStackParamList = {
  [AppNavigation.Earn.NotEnoughAvax]: undefined
  [AppNavigation.Earn.GetStarted]: undefined
  [AppNavigation.Earn.StakingAmount]: undefined
  [AppNavigation.Earn.StakingDuration]: { stakingAmount: BN }
  [AppNavigation.Earn.AdvancedStaking]: {
    stakingDuration: Date
    stakingAmount: BN
  }
  [AppNavigation.Earn.SelectNode]: {
    stakingDuration: Date
    stakingAmount: BN
    minUptime?: string
    maxFee?: string
  }
  [AppNavigation.Earn.NodeSearch]: { stakingDuration: Date; stakingAmount: BN }
  [AppNavigation.Earn.Confirmation]: {
    validator: NodeValidator
    stakingAmount: BN
  }
  [AppNavigation.Earn.Cancel]: undefined
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
        name={AppNavigation.Earn.AdvancedStaking}
        component={AdvancedStaking}
      />
      <EarnStack.Screen
        name={AppNavigation.Earn.SelectNode}
        component={SelectNode}
      />
      <EarnStack.Screen
        name={AppNavigation.Earn.StakingAmount}
        component={StakingAmount}
      />
      <EarnStack.Screen
        name={AppNavigation.Earn.StakingDuration}
        component={StakingDuration}
      />
      <EarnStack.Screen
        name={AppNavigation.Earn.NodeSearch}
        component={NodeSearch}
        options={{
          headerShown: false
        }}
      />
      <EarnStack.Screen
        name={AppNavigation.Earn.Confirmation}
        component={Confirmation}
        options={{
          headerLeft: ConfirmationBackButton
        }}
      />
      <EarnStack.Screen
        options={{ presentation: 'transparentModal' }}
        name={AppNavigation.Earn.Cancel}
        component={CancelModal}
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

type ConfirmationNavigationProp = EarnScreenProps<
  typeof AppNavigation.Earn.Confirmation
>['navigation']

const ConfirmationBackButton = () => {
  const { goBack, getState, navigate } =
    useNavigation<ConfirmationNavigationProp>()

  const handleGoBack = () => {
    const navigationState = getState()
    const previousScreen =
      navigationState.index >= 2
        ? navigationState.routes[navigationState.index - 1]
        : undefined

    if (previousScreen?.name === AppNavigation.Earn.NodeSearch) {
      const stakingAmount = previousScreen.params?.stakingAmount
      if (stakingAmount) {
        return navigate(AppNavigation.Earn.StakingDuration, {
          stakingAmount
        })
      }
      return navigate(AppNavigation.Earn.StakingAmount)
    }
    goBack()
  }

  return <HeaderBackButton onPress={handleGoBack} />
}

export default React.memo(EarnScreenStack)
