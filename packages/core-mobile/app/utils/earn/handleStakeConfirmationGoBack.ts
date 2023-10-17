import AppNavigation from 'navigation/AppNavigation'
import { StakeSetupScreenProps } from 'navigation/types'

type ConfirmationNavigationProp = StakeSetupScreenProps<
  typeof AppNavigation.StakeSetup.Confirmation
>['navigation']

type NodeSearchRouteProp = StakeSetupScreenProps<
  typeof AppNavigation.StakeSetup.NodeSearch
>

export const handleStakeConfirmationGoBack = (
  navigation: ConfirmationNavigationProp | NodeSearchRouteProp['navigation']
) => {
  const { goBack, getState, navigate } = navigation
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
    const stakingAmount = (previousScreen as NodeSearchRouteProp['route'])
      .params?.stakingAmount
    if (stakingAmount) {
      return navigate(AppNavigation.StakeSetup.StakingDuration, {
        stakingAmount
      })
    }
    return navigate(AppNavigation.StakeSetup.SmartStakeAmount)
  }
  goBack()
}
