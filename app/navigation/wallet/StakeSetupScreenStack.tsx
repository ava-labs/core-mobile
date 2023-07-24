import React from 'react'
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
import { BigIntNAvax, BigIntWeiAvax } from 'types/denominations'
import { useCChainBalance } from 'hooks/earn/useCChainBalance'

export type StakeSetupStackParamList = {
  [AppNavigation.StakeSetup.NotEnoughAvax]: undefined
  [AppNavigation.StakeSetup.GetStarted]: undefined
  [AppNavigation.StakeSetup.StakingAmount]: undefined
  [AppNavigation.StakeSetup.StakingDuration]: { stakingAmount: BigIntNAvax }
  [AppNavigation.StakeSetup.AdvancedStaking]: {
    stakingEndTime: Date
    stakingAmount: BigIntNAvax
  }
  [AppNavigation.StakeSetup.SelectNode]: {
    stakingEndTime: Date
    stakingAmount: BigIntNAvax
    minUpTime?: number
    maxFee?: number
  }
  [AppNavigation.StakeSetup.NodeSearch]: {
    stakingEndTime: Date
    stakingAmount: BigIntNAvax
  }
  [AppNavigation.StakeSetup.Confirmation]: {
    nodeId: string
    stakingAmount: BigIntNAvax
    stakingEndTime: Date
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
        component={GetStartedScreen}
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

type GetStartedScreenProps = StakeSetupScreenProps<
  typeof AppNavigation.StakeSetup.GetStarted
>

const GetStartedScreen = () => {
  const { navigate } = useNavigation<GetStartedScreenProps['navigation']>()
  const { minStakeAmount } = useStakingParams()
  const cChainBalance = useCChainBalance()

  const navToStakingAmount = () => {
    const availableAvax = BigInt(
      cChainBalance.data?.balance ?? '0'
    ) as BigIntWeiAvax
    const notEnoughAvax = availableAvax < minStakeAmount

    if (notEnoughAvax) {
      navigate(AppNavigation.StakeSetup.NotEnoughAvax)
    } else {
      navigate(AppNavigation.StakeSetup.StakingAmount)
    }
  }
  return <GetStarted onNext={navToStakingAmount} />
}

type NotEnoughAvaxScreenProps = StakeSetupScreenProps<
  typeof AppNavigation.StakeSetup.NotEnoughAvax
>

const NotEnoughAvaxScreen = () => {
  const { navigate, getParent } =
    useNavigation<NotEnoughAvaxScreenProps['navigation']>()

  const navToBuy = () => {
    getParent()?.goBack()
    navigate(AppNavigation.Wallet.Buy)
  }
  const navToReceive = () => {
    getParent()?.goBack()
    navigate(AppNavigation.Wallet.ReceiveTokens)
  }
  const navToSwap = () => {
    getParent()?.goBack()
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
