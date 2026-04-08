import { ChainId, Network, NetworkVMType } from '@avalabs/core-chains-sdk'
import { AppListenerEffectAPI, AppStartListening } from 'store/types'
import { onAppUnlocked } from 'store/app'
import {
  noActiveNetwork,
  selectCustomNetworks,
  setActive,
  selectEnabledChainIds,
  toggleEnabledChainId,
  enableL2ChainIds,
  enableChainIds,
  alwaysEnabledChainIds,
  defaultEnabledL2ChainIds
} from 'store/network/slice'
import {
  selectIsDeveloperMode,
  toggleDeveloperMode
} from 'store/settings/advanced'
import { AnyAction, isAnyOf } from '@reduxjs/toolkit'
import AnalyticsService from 'services/analytics/AnalyticsService'
import {
  selectHasBeenViewedOnce,
  setViewOnce,
  ViewOnceKey
} from 'store/viewOnce'
import { selectActiveAccount } from 'store/account'
import GlacierService from 'services/glacier/GlacierService'
import { getNetworksFromCache } from 'hooks/networks/utils/getNetworksFromCache'
import { isXChain } from 'utils/network/isAvalancheNetwork'
import Logger from 'utils/Logger'

const adjustActiveNetwork = (
  _: AnyAction,
  listenerApi: AppListenerEffectAPI
): void => {
  const { dispatch, getState } = listenerApi
  const state = getState()
  const isDeveloperMode = selectIsDeveloperMode(state)

  const chainId = isDeveloperMode
    ? ChainId.AVALANCHE_TESTNET_ID
    : ChainId.AVALANCHE_MAINNET_ID

  dispatch(setActive(chainId))
}

const setActiveNetwork = async (
  _: AnyAction,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const { dispatch, getState } = listenerApi
  const state = getState()
  if (state.network.active === noActiveNetwork) {
    dispatch(setActive(ChainId.AVALANCHE_MAINNET_ID))
  }
}

const toggleEnabledChainIdSideEffect = (
  action: AnyAction,
  listenerApi: AppListenerEffectAPI
): void => {
  const chainId = action.payload
  const { getState } = listenerApi
  const state = getState()
  const customNetworks = selectCustomNetworks(state)
  const enabledChainIds = selectEnabledChainIds(state)
  const isCustomNetwork = Object.values(customNetworks)
    .map((n: Network) => n.chainId)
    .includes(chainId)

  const event = enabledChainIds.includes(chainId)
    ? 'NetworkEnabled'
    : 'NetworkDisabled'

  AnalyticsService.capture(event, {
    networkChainId: chainId,
    isCustom: isCustomNetwork
  })
}

const enableL2ChainIdsIfNeeded = (
  _: AnyAction,
  listenerApi: AppListenerEffectAPI
): void => {
  const { dispatch, getState } = listenerApi
  const state = getState()
  const hasToggledL2ChainIds = selectHasBeenViewedOnce(
    ViewOnceKey.AUTO_ENABLE_L2_CHAINS
  )(state)

  if (hasToggledL2ChainIds === false) {
    dispatch(enableL2ChainIds())
    dispatch(setViewOnce(ViewOnceKey.AUTO_ENABLE_L2_CHAINS))
  }
}

/**
 * On every app unlock, check all known Avalanche L1 networks (those that are
 * not default/always-enabled chains and not X-chain) for a non-zero native
 * balance on the active account's EVM address via Glacier.  Any L1 with a
 * balance is automatically added to the user's enabled chain list.
 *
 * Running on each unlock (rather than once) means newly-funded L1s are picked
 * up without the user having to manually enable them.
 */
const autoEnableL1Networks = async (
  _: AnyAction,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const { dispatch, getState } = listenerApi
  const state = getState()

  const activeAccount = selectActiveAccount(state)
  const address = activeAccount?.addressC
  if (!address) {
    return
  }

  const isDeveloperMode = selectIsDeveloperMode(state)
  const enabledChainIds = selectEnabledChainIds(state)
  const customNetworks = selectCustomNetworks(state)
  const customChainIds = Object.values(customNetworks).map(n => n.chainId)

  // Fetch the full network list from the React Query cache (populated at
  // startup by useGetNetworks).  If the cache is empty we bail out – the
  // listener will run again on the next unlock.
  const allNetworks = getNetworksFromCache({ includeSolana: false })
  if (!allNetworks) {
    return
  }

  // Identify L1 candidates: EVM mainnet/testnet networks that are not already
  // in the always-enabled, default-L2 or X-chain sets, and are not custom
  // networks, and are not already enabled by the user.
  const l1Candidates = Object.values(allNetworks).filter(
    (network): network is Network =>
      network !== undefined &&
      network.vmName === NetworkVMType.EVM &&
      network.isTestnet === isDeveloperMode &&
      !alwaysEnabledChainIds.includes(network.chainId) &&
      !defaultEnabledL2ChainIds.includes(network.chainId) &&
      !isXChain(network.chainId) &&
      !customChainIds.includes(network.chainId) &&
      !enabledChainIds.includes(network.chainId)
  )

  if (l1Candidates.length === 0) {
    return
  }

  // Query Glacier for each candidate in parallel; collect those with a
  // non-zero balance.
  const results = await Promise.allSettled(
    l1Candidates.map(async network => {
      const response = await GlacierService.getNativeBalance({
        chainId: network.chainId.toString(),
        address
      })
      return { chainId: network.chainId, balance: response.nativeTokenBalance.balance }
    })
  )

  const chainIdsWithBalance: number[] = results.reduce<number[]>(
    (acc, result) => {
      if (
        result.status === 'fulfilled' &&
        result.value.balance !== '0'
      ) {
        acc.push(result.value.chainId)
      }
      return acc
    },
    []
  )

  if (chainIdsWithBalance.length === 0) {
    return
  }

  Logger.info(
    `[autoEnableL1Networks] enabling ${chainIdsWithBalance.length} L1 network(s) with balance: ${chainIdsWithBalance.join(', ')}`
  )
  dispatch(enableChainIds(chainIdsWithBalance))
}

export const addNetworkListeners = (
  startListening: AppStartListening
): void => {
  startListening({
    matcher: isAnyOf(onAppUnlocked, toggleDeveloperMode),
    effect: setActiveNetwork
  })

  startListening({
    actionCreator: toggleDeveloperMode,
    effect: adjustActiveNetwork
  })

  startListening({
    matcher: isAnyOf(toggleEnabledChainId),
    effect: toggleEnabledChainIdSideEffect
  })

  startListening({
    matcher: isAnyOf(onAppUnlocked),
    effect: enableL2ChainIdsIfNeeded
  })

  startListening({
    actionCreator: onAppUnlocked,
    effect: autoEnableL1Networks
  })
}
