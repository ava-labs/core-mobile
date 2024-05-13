import { v4 as uuidv4 } from 'uuid'
import { Network } from '@avalabs/chains-sdk'
import { isAnyOf, TaskAbortError } from '@reduxjs/toolkit'
import BalanceService from 'services/balance/BalanceService'
import { AppListenerEffectAPI } from 'store'
import {
  Account,
  selectAccounts,
  selectActiveAccount,
  setAccounts,
  setActiveAccountIndex
} from 'store/account'
import { onAppLocked, onAppUnlocked, onLogOut } from 'store/app'
import { addCustomToken } from 'store/customToken'
import { AppStartListening } from 'store/middleware/listener'
import {
  selectActiveNetwork,
  onNetworksFetched,
  selectFavoriteNetworks
} from 'store/network'
import {
  selectSelectedCurrency,
  setSelectedCurrency
} from 'store/settings/currency'
import Logger from 'utils/Logger'
import { getLocalTokenId } from 'store/balance/utils'
import SentryWrapper from 'services/sentry/SentryWrapper'
import { BalancesForAccount } from '../../services/balance/BalanceService'
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
    // Just in case the active network has not been favorited
    if (!favoriteNetworks.map(n => n.chainId).includes(activeNetwork.chainId)) {
      // move the active network to the front of the list
      favoriteNetworks.unshift(activeNetwork)
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
    currentStatus !== QueryStatus.IDLE
  ) {
    Logger.info('a balance query is already in flight')
    return
  }

  const sentryTrx = SentryWrapper.startTransaction('get-balances')

  dispatch(setStatus(queryStatus))

  const currency = selectSelectedCurrency(state).toLowerCase()

  // fetch the first network balances first
  const network = networks.shift()
  if (network === undefined) return

  const promises = accounts.map(account => {
    return BalanceService.getBalancesForAccount({
      network,
      account,
      currency,
      sentryTrx
    })
  })
  const balances = await fetchBalanceForAccounts(promises)
  dispatch(setBalances(balances))

  // fetch all other network balances
  if (networks.length === 0) return

  const inactiveNetworkPromises: Promise<BalancesForAccount>[] = []

  for (const n of networks) {
    inactiveNetworkPromises.push(
      ...accounts.map(account => {
        return BalanceService.getBalancesForAccount({
          network: n,
          account,
          currency,
          sentryTrx
        })
      })
    )
  }
  const inactiveNetworkbalances = await fetchBalanceForAccounts(
    inactiveNetworkPromises
  )
  dispatch(setBalances(inactiveNetworkbalances))

  dispatch(setStatus(QueryStatus.IDLE))
  SentryWrapper.finish(sentryTrx)
}

const fetchBalancePeriodically = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  action: any,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const { condition } = listenerApi
  onBalanceUpdate(QueryStatus.LOADING, listenerApi, false)

  const pollingTask = listenerApi.fork(async forkApi => {
    const taskId = uuidv4().slice(0, 8)
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

        // cancellation-aware wait for the balande update to be done
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
  promises: Promise<BalancesForAccount>[]
): Promise<Balances> => {
  return (await Promise.allSettled(promises)).reduce<Balances>(
    (acc, result) => {
      if (result.status === 'rejected') {
        Logger.warn('failed to get balance', result.reason)
        return acc
      }

      const { accountIndex, chainId, tokens } = result.value

      const tokensWithBalance = tokens.map(token => {
        return {
          ...token,
          localId: getLocalTokenId(token)
        } as LocalTokenWithBalance
      })
      return {
        ...acc,
        [getKey(chainId, accountIndex)]: {
          accountIndex,
          chainId,
          tokens: tokensWithBalance
        }
      }
    },
    {}
  )
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
      onNetworksFetched
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
}
