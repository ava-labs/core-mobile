import React from 'react'
import AppNavigation from 'navigation/AppNavigation'
import { createStackNavigator } from '@react-navigation/stack'
import GetStarted from 'screens/earn/GetStarted'
import { StakeSetupScreenProps } from 'navigation/types'
import { useNavigation } from '@react-navigation/native'
import { StakingDuration } from 'screens/earn/durationScreen'
import { NodeSearch } from 'screens/earn/NodeSearch'
import AdvancedStaking from 'screens/earn/AdvancedStaking'
import SelectNode from 'screens/earn/SelectNode'
import { Confirmation } from 'screens/earn/Confirmation/Confirmation'
import { CancelModal } from 'screens/earn/CancelModal'
import SmartStakeAmount from 'screens/earn/SmartStakeAmount'
import { Avax } from 'types/Avax'
import { BackButton } from 'components/BackButton'
import { FundsStuckModal } from 'screens/earn/FundsStuckModal'
import { handleStakeConfirmationGoBack } from 'utils/earn/handleStakeConfirmationGoBack'
import AnalyticsService from 'services/analytics/AnalyticsService'

export type StakeSetupStackParamList = {
  [AppNavigation.StakeSetup.GetStarted]: undefined
  [AppNavigation.StakeSetup.SmartStakeAmount]: undefined
  [AppNavigation.StakeSetup.StakingDuration]: { stakingAmount: Avax }
  [AppNavigation.StakeSetup.AdvancedStaking]: {
    stakingEndTime: Date
    stakingAmount: Avax
    selectedDuration: string
  }
  [AppNavigation.StakeSetup.SelectNode]: {
    stakingEndTime: Date
    stakingAmount: Avax
    minUpTime?: number
    maxFee?: number
  }
  [AppNavigation.StakeSetup.NodeSearch]: {
    stakingEndTime: Date
    stakingAmount: Avax
  }
  [AppNavigation.StakeSetup.Confirmation]: {
    nodeId: string
    stakingAmount: Avax
    stakingEndTime: Date
    onBack?: () => void
  }
  [AppNavigation.StakeSetup.Cancel]: undefined
  [AppNavigation.StakeSetup.FundsStuck]: {
    onTryAgain: () => void
  }
}

const Stack = createStackNavigator<StakeSetupStackParamList>()

function StakeSetupScreenStack(): JSX.Element {
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
        name={AppNavigation.StakeSetup.SmartStakeAmount}
        component={SmartStakeAmount}
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
      <Stack.Screen
        options={{ presentation: 'transparentModal' }}
        name={AppNavigation.StakeSetup.FundsStuck}
        component={FundsStuckModal}
      />
    </Stack.Navigator>
  )
}

type GetStartedScreenProps = StakeSetupScreenProps<
  typeof AppNavigation.StakeSetup.GetStarted
>

const GetStartedScreen = (): JSX.Element => {
  const { navigate } = useNavigation<GetStartedScreenProps['navigation']>()

  const navToSmartStakeAmount = (): void => {
    AnalyticsService.capture('StakeOpenEnterAmount')
    navigate(AppNavigation.StakeSetup.SmartStakeAmount)
  }

  return <GetStarted onNext={navToSmartStakeAmount} />
}

type ConfirmationNavigationProp = StakeSetupScreenProps<
  typeof AppNavigation.StakeSetup.Confirmation
>['navigation']

const ConfirmationBackButton = (): JSX.Element => {
  const navigation = useNavigation<ConfirmationNavigationProp>()

  const onPress = (): void => {
    handleStakeConfirmationGoBack(navigation)
  }
  return <BackButton onPress={onPress} />
}

export default React.memo(StakeSetupScreenStack)
