import { isAnyOf, Action } from '@reduxjs/toolkit'
import { AppListenerEffectAPI, AppStartListening } from 'store/types'
import { selectActiveAccount, setAccounts } from 'store/account'
import { onAppUnlocked } from 'store/app'
import {
  selectEnabledNetworks,
  toggleEnabledChainId
} from 'store/network/slice'
import Logger from 'utils/Logger'
import { selectHasBeenViewedOnce, setViewOnce } from 'store/viewOnce/slice'
import { ViewOnceKey } from 'store/viewOnce/types'
import NetworkService from 'services/network/NetworkService'
import { selectIsDeveloperMode } from 'store/settings/advanced/slice'
import ActivityService from 'services/activity/ActivityService'
import { runAfterInteractions } from 'utils/runAfterInteractions'

const addXChainToEnabledChainIdsIfNeeded = async (
  _: Action,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const { getState, dispatch } = listenerApi
  const state = getState()

  //check if we've added X chain before
  const hadAddedXChainToEnabledChainIds = selectHasBeenViewedOnce(
    ViewOnceKey.X_CHAIN_FAVORITE
  )(state)

  if (hadAddedXChainToEnabledChainIds) {
    Logger.trace('Already added X-chain to enabled chain ids')
    return
  }
  //check if X chain already in enabled chain id list
  const isDeveloperMode = selectIsDeveloperMode(state)
  const avalancheNetworkX = NetworkService.getAvalancheNetworkX(isDeveloperMode)
  const enabledNetworks = selectEnabledNetworks(state)

  if (
    enabledNetworks.find(
      value => value.chainId === avalancheNetworkX.chainId
    ) !== undefined
  ) {
    Logger.trace('X-chain already in enabled chain id list')
    return
  }

  //check if any activity on X chain
  const activeAccount = selectActiveAccount(state)
  if (activeAccount === undefined) {
    Logger.trace('No active account, skipping add for X-chain')
    return
  }

  const activities = await runAfterInteractions(async () => {
    return ActivityService.getActivities({
      network: avalancheNetworkX,
      account: activeAccount,
      shouldAnalyzeBridgeTxs: false
    })
  })

  if (activities?.transactions?.length === 0) {
    Logger.trace('No activities, skipping add for X-chain')
    return
  }

  Logger.info('Adding X-Chain to enabled chain ids')
  dispatch(toggleEnabledChainId(avalancheNetworkX.chainId))
  dispatch(setViewOnce(ViewOnceKey.X_CHAIN_FAVORITE))
}

export const addBalanceListeners = (
  startListening: AppStartListening
): void => {
  startListening({
    matcher: isAnyOf(onAppUnlocked, setAccounts),
    effect: addXChainToEnabledChainIdsIfNeeded
  })
}
