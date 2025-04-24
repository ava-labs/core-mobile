import { Network } from '@avalabs/core-chains-sdk'
import { Action, isAnyOf, TaskAbortError } from '@reduxjs/toolkit'
import BalanceService, {
  BalancesForAccount
} from 'services/balance/BalanceService'
import { AppListenerEffectAPI, RootState } from 'store'
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
  addCustomNetwork,
  onNetworksFetched,
  selectCustomNetworks,
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
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { Networks } from 'store/network'
import { queryClient } from 'contexts/ReactQueryProvider'
import { Balances, LocalTokenWithBalance, QueryStatus } from './types'
import {
  fetchBalanceForAccount,
  getKey,
  refetchBalance,
  selectBalanceStatus,
  setBalances,
  setStatus
} from './slice'

/**
 * In production:
 *  - Update balances for all networks and accounts every 10 seconds
 *
 * In development:
 *  - Update balances for all networks and accounts every 60 seconds
 */
export const PollingConfig = {
  allNetworks: __DEV__ ? 60000 : 10000
}

export const AVAX_X_ID = 'AVAX-X'
export const AVAX_P_ID = 'AVAX-P'

const getNetworksToFetch = async (
  state: RootState,
  address: string
): Promise<Network[]> => {
  // combine all primary networks, custom networks and last transacted networks
  // to fetch balances for
  const customNetworks = selectCustomNetworks(state)
  const favoriteNetworks = selectFavoriteNetworks(state)
  let lastTransactedNetworks = {} as Networks
  try {
    lastTransactedNetworks = await queryClient.fetchQuery({
      staleTime: Infinity,
      queryKey: [ReactQueryKeys.LAST_TRANSACTED_ERC20_NETWORKS, address],
      queryFn: () =>
        NetworkService.fetchLastTransactedERC20Networks({
          address
        }),
      retry(failureCount) {
        return failureCount < 3
      }
    })
  } catch (error) {
    Logger.error('Error fetching last transacted ERC20 networks', error)
  }
  return [
    ...favoriteNetworks,
    ...Object.values(customNetworks),
    ...Object.values(lastTransactedNetworks)
  ]
}

const onBalanceUpdate = async (
  queryStatus: QueryStatus,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const { getState } = listenerApi
  const state = getState()
  const account = selectActiveAccount(state)
  const networksToFetch = await getNetworksToFetch(
    state,
    account?.addressC ?? ''
  )

  onBalanceUpdateCore({
    queryStatus,
    listenerApi,
    networks: networksToFetch,
    account
  }).catch(Logger.error)
}

const onBalanceUpdateCore = async ({
  queryStatus,
  listenerApi,
  networks,
  account
}: {
  queryStatus: QueryStatus
  listenerApi: AppListenerEffectAPI
  networks: Network[]
  account?: Account
}): Promise<void> => {
  if (networks.length === 0 || account === undefined) return

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

  SentryWrapper.startSpan(
    { name: 'get-balances', contextName: 'svc.balance.get_for_account' },
    async span => {
      // fetch all network balances
      const customTokens = selectAllCustomTokens(state)
      const networkPromises: {
        key: string
        promise: Promise<BalancesForAccount>
      }[] = []

      for (const n of networks) {
        const customTokensByChainIdAndNetwork =
          customTokens[n.chainId.toString()] ?? []
        networkPromises.push({
          key: getKey(n.chainId, account.index),
          promise: BalanceService.getBalancesForAccount({
            network: n,
            account,
            currency,
            customTokens: customTokensByChainIdAndNetwork
          })
        })
      }
      const networkBalances = await fetchBalanceForNetworks(networkPromises)
      dispatch(setBalances(networkBalances))
      dispatch(setStatus(QueryStatus.IDLE))
      span?.end()
    }
  )
}

const fetchBalancePeriodically = async (
  _: Action,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const { condition } = listenerApi
  onBalanceUpdate(QueryStatus.LOADING, listenerApi)

  const pollingTask = listenerApi.fork(async forkApi => {
    const taskId = uuid().slice(0, 8)
    Logger.info(`started task ${taskId}`, 'fetch balance periodically')

    try {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        // cancellation-aware wait for the balance update to be done
        await forkApi.pause(onBalanceUpdate(QueryStatus.POLLING, listenerApi))
        // cancellation-aware delay
        await forkApi.delay(PollingConfig.allNetworks)
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
  const accounts = selectAccounts(state)
  const accountToFetchFor = accounts[accountIndex]
  const networksToFetch = await getNetworksToFetch(
    state,
    accountToFetchFor?.addressC ?? ''
  )

  onBalanceUpdateCore({
    queryStatus: QueryStatus.LOADING,
    listenerApi,
    networks: networksToFetch,
    account: accountToFetchFor
  }).catch(Logger.error)
}

const fetchBalanceForNetworks = async (
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
    effect: async (_, listenerApi) =>
      onBalanceUpdate(QueryStatus.REFETCHING, listenerApi)
  })

  startListening({
    matcher: isAnyOf(
      setSelectedCurrency,
      setAccounts,
      setActiveAccountIndex,
      addCustomToken,
      onNetworksFetched,
      toggleFavorite,
      addCustomNetwork
    ),
    effect: async (_, listenerApi) =>
      onBalanceUpdate(QueryStatus.LOADING, listenerApi)
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
