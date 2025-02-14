import { Network } from '@avalabs/core-chains-sdk'
import { Action, isAnyOf, TaskAbortError } from '@reduxjs/toolkit'
import BalanceService, {
  BalancesForAccount
} from 'services/balance/BalanceService'
import { AppListenerEffectAPI } from 'store'
import { Account } from 'store/account/types'
import {
  selectAccounts,
  selectActiveAccount,
  setAccounts,
  setActiveAccountIndex
} from 'store/account'
import { onAppLocked, onAppUnlocked, onLogOut } from 'store/app'
import { addCustomToken, selectAllCustomTokens } from 'store/customToken'
import { AppStartListening } from 'store/middleware/listener'
import {
  onNetworksFetched,
  selectActiveNetwork,
  selectFavoriteNetworks,
  toggleFavorite
} from 'store/network/slice'
import {
  selectSelectedCurrency,
  setSelectedCurrency
} from 'store/settings/currency/slice'
import Logger from 'utils/Logger'
import { getLocalTokenId } from 'store/balance/utils'
import { selectHasBeenViewedOnce, setViewOnce } from 'store/viewOnce/slice'
import { ViewOnceKey } from 'store/viewOnce/types'
import NetworkService from 'services/network/NetworkService'
import { selectIsDeveloperMode } from 'store/settings/advanced/slice'
import { isPChain, isXChain } from 'utils/network/isAvalancheNetwork'
import ActivityService from 'services/activity/ActivityService'
import { uuid } from 'utils/uuid'
import SentryWrapper from 'services/sentry/SentryWrapper'
import {
  fetchBalanceForAccount,
  getKey,
  refetchBalance,
  selectBalanceStatus,
  setBalances,
  setStatus
} from './slice'
import { Balances, LocalTokenWithBalance, QueryStatus } from './types'

/**
 * In production:
 *  - Update balances every 2 seconds for the active network
 *  - Update balances for all networks and accounts every 30 seconds
 *
 * In development:
 *  - Update balances every 30 seconds for the active network
 *  - Update balances for all networks and accounts every 60 seconds
 */
export const PollingConfig = {
  activeNetwork: __DEV__ ? 30000 : 2000,
  allNetworks: __DEV__ ? 60000 : 30000
}

export const AVAX_X_ID = 'AVAX-X'
export const AVAX_P_ID = 'AVAX-P'

const allNetworksOperand =
  PollingConfig.allNetworks / PollingConfig.activeNetwork

const onBalanceUpdate = async (
  queryStatus: QueryStatus,
  listenerApi: AppListenerEffectAPI,
  fetchActiveOnly: boolean
): Promise<void> => {
  const state = listenerApi.getState()
  const activeNetwork = selectActiveNetwork(state)

  let networksToFetch: Network[]
  const activeAccount = selectActiveAccount(state)
  const accountsToFetch = activeAccount ? [activeAccount] : []

  if (fetchActiveOnly) {
    networksToFetch = [activeNetwork]
  } else {
    const favoriteNetworks = selectFavoriteNetworks(state)

    if (
      // in case the active network has not been favorited
      !favoriteNetworks.map(n => n.chainId).includes(activeNetwork.chainId) ||
      // or the active network is not the first in the list
      favoriteNetworks[0]?.chainId !== activeNetwork.chainId
    ) {
      // move the active network to the front of the list
      networksToFetch = [activeNetwork, ...favoriteNetworks]
    }

    networksToFetch = favoriteNetworks
  }

  onBalanceUpdateCore({
    queryStatus,
    listenerApi,
    networks: networksToFetch,
    accounts: accountsToFetch
  }).catch(Logger.error)
}

const onBalanceUpdateCore = async ({
  queryStatus,
  listenerApi,
  networks,
  accounts
}: {
  queryStatus: QueryStatus
  listenerApi: AppListenerEffectAPI
  networks: Network[]
  accounts: Account[]
}): Promise<void> => {
  if (networks.length === 0) return

  const { getState, dispatch } = listenerApi
  const state = getState()
  const currentStatus = selectBalanceStatus(state)

  if (
    queryStatus === QueryStatus.POLLING &&
    [QueryStatus.LOADING, QueryStatus.REFETCHING, QueryStatus.POLLING].includes(
      currentStatus
    )
  ) {
    Logger.info('a balance query is already in flight')
    return
  }

  dispatch(setStatus(queryStatus))

  const currency = selectSelectedCurrency(state).toLowerCase()

  const [firstNetwork, ...restNetworks] = networks

  // fetch the first network balances first
  if (firstNetwork === undefined) return

  SentryWrapper.startSpan(
    { name: 'get-balances', contextName: 'svc.balance.get_for_account' },
    async span => {
      const balanceKeyedPromises = accounts.map(account => {
        return {
          key: getKey(firstNetwork.chainId, account.index),
          promise: BalanceService.getBalancesForAccount({
            network: firstNetwork,
            account,
            currency
          })
        }
      })
      const balances = await fetchBalanceForAccounts(balanceKeyedPromises)

      dispatch(setBalances(balances))

      // fetch all other network balances
      if (restNetworks.length > 0) {
        const customTokens = selectAllCustomTokens(state)
        const inactiveNetworkPromises: {
          key: string
          promise: Promise<BalancesForAccount>
        }[] = []

        for (const n of restNetworks) {
          const customTokensByChainIdAndNetwork =
            customTokens[n.chainId.toString()] ?? []
          inactiveNetworkPromises.push(
            ...accounts.map(account => {
              return {
                key: getKey(n.chainId, account.index),
                promise: BalanceService.getBalancesForAccount({
                  network: n,
                  account,
                  currency,
                  customTokens: customTokensByChainIdAndNetwork
                })
              }
            })
          )
        }
        const inactiveNetworkBalances = await fetchBalanceForAccounts(
          inactiveNetworkPromises
        )
        dispatch(setBalances(inactiveNetworkBalances))
      }

      dispatch(setStatus(QueryStatus.IDLE))
      span?.end()
    }
  )
}

const fetchBalancePeriodically = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  action: any,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const { condition } = listenerApi
  onBalanceUpdate(QueryStatus.LOADING, listenerApi, false)

  const pollingTask = listenerApi.fork(async forkApi => {
    const taskId = uuid().slice(0, 8)
    Logger.info(`started task ${taskId}`, 'fetch balance periodically')

    let intervalCount = 1

    try {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        let fetchActiveOnly

        if (intervalCount % allNetworksOperand === 0) {
          fetchActiveOnly = false
        } else {
          fetchActiveOnly = true
        }

        // cancellation-aware wait for the balance update to be done
        await forkApi.pause(
          onBalanceUpdate(QueryStatus.POLLING, listenerApi, fetchActiveOnly)
        )

        intervalCount += 1

        // cancellation-aware delay
        await forkApi.delay(PollingConfig.activeNetwork)
      }
    } catch (err) {
      if (err instanceof TaskAbortError) {
        // task got cancelled or the listener got cancelled
        Logger.info(`stopped task ${taskId}`)
      }
    }
  })

  await condition(isAnyOf(onAppLocked, onLogOut))
  pollingTask.cancel()
}

const handleFetchBalanceForAccount = async (
  listenerApi: AppListenerEffectAPI,
  accountIndex: number
): Promise<void> => {
  const state = listenerApi.getState()
  const activeNetwork = selectActiveNetwork(state)

  const accounts = selectAccounts(state)
  const accountToFetchFor = accounts[accountIndex]
  const accountsToFetch = accountToFetchFor ? [accountToFetchFor] : []
  const networksToFetch = selectFavoriteNetworks(state)
  // Just in case the active network has not been favorited
  if (!networksToFetch.map(n => n.chainId).includes(activeNetwork.chainId)) {
    networksToFetch.push(activeNetwork)
  }

  onBalanceUpdateCore({
    queryStatus: QueryStatus.LOADING,
    listenerApi,
    networks: networksToFetch,
    accounts: accountsToFetch
  }).catch(Logger.error)
}

const fetchBalanceForAccounts = async (
  keyedPromises: { promise: Promise<BalancesForAccount>; key: string }[]
): Promise<Balances> => {
  const keys = keyedPromises.map(value => value.key)
  return (
    await Promise.allSettled(keyedPromises.map(value => value.promise))
  ).reduce<Balances>((acc, result, i) => {
    if (result.status === 'rejected') {
      Logger.warn('failed to get balance', result.reason)
      const key: string = keys[i] ?? ''
      acc[key] = {
        dataAccurate: false,
        accountIndex: -1,
        chainId: 0,
        tokens: []
      }
      return acc
    }

    const { accountIndex, chainId, tokens } = result.value
    const balances = {
      dataAccurate: true,
      accountIndex,
      chainId,
      tokens: [] as LocalTokenWithBalance[]
    }

    balances.tokens = tokens.reduce((tokenBalance, token) => {
      if ('error' in token) {
        balances.dataAccurate = false
        return {
          ...tokenBalance,
          isDataAccurate: false,
          networkChainId: chainId
        }
      }
      if (isPChain(chainId)) {
        return [
          ...tokenBalance,
          {
            ...token,
            localId: AVAX_P_ID,
            isDataAccurate: true,
            networkChainId: chainId
          }
        ]
      }
      if (isXChain(chainId)) {
        return [
          ...tokenBalance,
          {
            ...token,
            localId: AVAX_X_ID,
            isDataAccurate: true,
            networkChainId: chainId
          }
        ]
      }
      return [
        ...tokenBalance,
        {
          ...token,
          localId: getLocalTokenId(token),
          isDataAccurate: true,
          networkChainId: chainId
        }
      ]
    }, [] as LocalTokenWithBalance[])

    acc[getKey(chainId, accountIndex)] = balances
    return acc
  }, {})
}

const addPChainToFavoritesIfNeeded = async (
  _: Action,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const { getState, dispatch } = listenerApi
  const state = getState()
  //check if we've added P chain before
  const hadAddedPChainToFavorites = selectHasBeenViewedOnce(
    ViewOnceKey.P_CHAIN_FAVORITE
  )(state)
  if (hadAddedPChainToFavorites) {
    Logger.trace('Already added P-chain to favorites')
    return
  }
  //check if P chain already in favorites list
  const isDeveloperMode = selectIsDeveloperMode(state)
  const avalancheNetworkP = NetworkService.getAvalancheNetworkP(isDeveloperMode)
  const favoriteNetworks = selectFavoriteNetworks(state)
  if (
    favoriteNetworks.find(
      value => value.chainId === avalancheNetworkP.chainId
    ) !== undefined
  ) {
    Logger.trace('P-chain already in fav list')
    return
  }

  //check if any activity on P chain
  const activeAccount = selectActiveAccount(state)

  if (activeAccount === undefined) {
    Logger.trace('No active account, skipping add for P-chain')
    return
  }
  const activities = await ActivityService.getActivities({
    network: avalancheNetworkP,
    account: activeAccount,
    shouldAnalyzeBridgeTxs: false
  })
  if (activities.transactions.length === 0) {
    Logger.trace('No activities, skipping add for P-chain')
    return
  }

  Logger.info('Adding P-Chain to favorites')
  dispatch(toggleFavorite(avalancheNetworkP.chainId))
  dispatch(setViewOnce(ViewOnceKey.P_CHAIN_FAVORITE))
}

const addXChainToFavoritesIfNeeded = async (
  _: Action,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const { getState, dispatch } = listenerApi
  const state = getState()

  //check if we've added X chain before
  const hadAddedXChainToFavorites = selectHasBeenViewedOnce(
    ViewOnceKey.X_CHAIN_FAVORITE
  )(state)

  if (hadAddedXChainToFavorites) {
    Logger.trace('Already added X-chain to favorites')
    return
  }
  //check if X chain already in favorites list
  const isDeveloperMode = selectIsDeveloperMode(state)
  const avalancheNetworkX = NetworkService.getAvalancheNetworkX(isDeveloperMode)
  const favoriteNetworks = selectFavoriteNetworks(state)

  if (
    favoriteNetworks.find(
      value => value.chainId === avalancheNetworkX.chainId
    ) !== undefined
  ) {
    Logger.trace('X-chain already in fav list')
    return
  }

  //check if any activity on X chain
  const activeAccount = selectActiveAccount(state)
  if (activeAccount === undefined) {
    Logger.trace('No active account, skipping add for X-chain')
    return
  }
  const activities = await ActivityService.getActivities({
    network: avalancheNetworkX,
    account: activeAccount,
    shouldAnalyzeBridgeTxs: false
  })

  if (activities.transactions.length === 0) {
    Logger.trace('No activities, skipping add for X-chain')
    return
  }

  Logger.info('Adding X-Chain to favorites')
  dispatch(toggleFavorite(avalancheNetworkX.chainId))
  dispatch(setViewOnce(ViewOnceKey.X_CHAIN_FAVORITE))
}

export const addBalanceListeners = (
  startListening: AppStartListening
): void => {
  startListening({
    actionCreator: onAppUnlocked,
    effect: fetchBalancePeriodically
  })

  startListening({
    actionCreator: refetchBalance,
    effect: async (action, listenerApi) =>
      onBalanceUpdate(QueryStatus.REFETCHING, listenerApi, false)
  })

  startListening({
    matcher: isAnyOf(
      setSelectedCurrency,
      setAccounts,
      setActiveAccountIndex,
      addCustomToken,
      onNetworksFetched,
      toggleFavorite
    ),
    effect: async (action, listenerApi) =>
      onBalanceUpdate(QueryStatus.LOADING, listenerApi, false)
  })

  startListening({
    actionCreator: fetchBalanceForAccount,
    effect: async (action, listenerApi) => {
      handleFetchBalanceForAccount(listenerApi, action.payload.accountIndex)
    }
  })

  startListening({
    matcher: isAnyOf(onAppUnlocked, setAccounts),
    effect: addPChainToFavoritesIfNeeded
  })

  startListening({
    matcher: isAnyOf(onAppUnlocked, setAccounts),
    effect: addXChainToFavoritesIfNeeded
  })
}
