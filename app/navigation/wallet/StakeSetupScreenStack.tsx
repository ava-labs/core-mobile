import React, { useEffect } from 'react'
import { HeaderBackButton } from '@react-navigation/elements'
import AppNavigation from 'navigation/AppNavigation'
import { createStackNavigator } from '@react-navigation/stack'
import GetStarted from 'screens/earn/GetStarted'
import StakingAmount from 'screens/earn/StakingAmount'
import { StakeSetupScreenProps } from 'navigation/types'
import { useNavigation } from '@react-navigation/native'
import StakingDuration from 'screens/earn/DurationScreen'
import { NodeSearch } from 'screens/earn/NodeSearch'
import AdvancedStaking from 'screens/earn/AdvancedStaking'
import SelectNode from 'screens/earn/SelectNode'
import { Confirmation } from 'screens/earn/Confirmation'
import { CancelModal } from 'screens/earn/CancelModal'
import NotEnoughAvax from 'screens/earn/NotEnoughAvax'
import useStakingParams from 'hooks/earn/useStakingParams'
import Big from 'big.js'

export type StakeSetupStackParamList = {
  [AppNavigation.StakeSetup.NotEnoughAvax]: undefined
  [AppNavigation.StakeSetup.GetStarted]: undefined
  [AppNavigation.StakeSetup.StakingAmount]: undefined
  [AppNavigation.StakeSetup.StakingDuration]: { stakingAmount: Big }
  [AppNavigation.StakeSetup.AdvancedStaking]: {
    stakingEndTime: Date
    stakingAmount: Big
  }
  [AppNavigation.StakeSetup.SelectNode]: {
    stakingEndTime: Date
    stakingAmount: Big
    minUpTime?: number
    maxFee?: number
  }
  [AppNavigation.StakeSetup.NodeSearch]: {
    stakingEndTime: Date
    stakingAmount: Big
  }
  [AppNavigation.StakeSetup.Confirmation]: {
    nodeId: string
    stakingAmount: Big
  }
  [AppNavigation.StakeSetup.Cancel]: undefined
}

const Stack = createStackNavigator<StakeSetupStackParamList>()

function StakeSetupScreenStack() {
  return (
    <Stack.Navigator
      screenOptions={() => {
        return {
          headerShown: true,
          headerLeft: BackButton,
          title: ''
        }
      }}>
      <Stack.Screen
        name={AppNavigation.StakeSetup.GetStarted}
        component={EarnGetStartedScreen}
      />
      <Stack.Screen
        name={AppNavigation.StakeSetup.NotEnoughAvax}
        component={NotEnoughAvaxScreen}
      />
      <Stack.Screen
        name={AppNavigation.StakeSetup.AdvancedStaking}
        component={AdvancedStaking}
      />
      <Stack.Screen
        name={AppNavigation.StakeSetup.SelectNode}
        component={SelectNode}
      />
      <Stack.Screen
        name={AppNavigation.StakeSetup.StakingAmount}
        component={StakingAmount}
      />
      <Stack.Screen
        name={AppNavigation.StakeSetup.StakingDuration}
        component={StakingDuration}
      />
      <Stack.Screen
        name={AppNavigation.StakeSetup.NodeSearch}
        component={NodeSearch}
      />
      <Stack.Screen
        name={AppNavigation.StakeSetup.Confirmation}
        component={Confirmation}
        options={{
          headerLeft: ConfirmationBackButton
        }}
      />
      <Stack.Screen
        options={{ presentation: 'transparentModal' }}
        name={AppNavigation.StakeSetup.Cancel}
        component={CancelModal}
      />
    </Stack.Navigator>
  )
}

type EarnProps = StakeSetupScreenProps<
  typeof AppNavigation.StakeSetup.GetStarted
>

const EarnGetStartedScreen = () => {
  const { navigate, replace } = useNavigation<EarnProps['navigation']>()
  const { nativeTokenBalance, minStakeAmount } = useStakingParams()

  useEffect(() => {
    if (nativeTokenBalance && nativeTokenBalance.lt(minStakeAmount)) {
      replace(AppNavigation.StakeSetup.NotEnoughAvax)
    }
  }, [minStakeAmount, nativeTokenBalance, replace])

  const navToStakingAmount = () => {
    navigate(AppNavigation.StakeSetup.StakingAmount)
  }
  return <GetStarted onNext={navToStakingAmount} />
}

const NotEnoughAvaxScreen = () => {
  const { navigate, replace } = useNavigation<EarnProps['navigation']>()
  const { nativeTokenBalance, minStakeAmount } = useStakingParams()

  useEffect(() => {
    if (nativeTokenBalance && nativeTokenBalance.gte(minStakeAmount)) {
      replace(AppNavigation.StakeSetup.GetStarted)
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

type ConfirmationNavigationProp = StakeSetupScreenProps<
  typeof AppNavigation.StakeSetup.Confirmation
>['navigation']

const ConfirmationBackButton = () => {
  const { goBack, getState, navigate } =
    useNavigation<ConfirmationNavigationProp>()

  const handleGoBack = () => {
    const navigationState = getState()

    // the navigationState.index represents the current index of the route,
    // if the index is 1 or greater, meaning there is previous route in the stack,
    // we will get the previous route by index - 1
    // otherwise we return undefined and it simply calls goBack which goes back
    // to last screen in the previous stack
    const previousScreen =
      navigationState.index >= 1
        ? navigationState.routes[navigationState.index - 1]
        : undefined

    if (previousScreen?.name === AppNavigation.StakeSetup.NodeSearch) {
      const stakingAmount = previousScreen.params?.stakingAmount
      if (stakingAmount) {
        return navigate(AppNavigation.StakeSetup.StakingDuration, {
          stakingAmount
        })
      }
      return navigate(AppNavigation.StakeSetup.StakingAmount)
    }
    goBack()
  }

  return <HeaderBackButton onPress={handleGoBack} style={backButtonStyle} />
}

const BackButton = () => {
  const { goBack } = useNavigation()
  return <HeaderBackButton onPress={goBack} style={backButtonStyle} />
}

const backButtonStyle = { marginLeft: 8 }

export default React.memo(StakeSetupScreenStack)
