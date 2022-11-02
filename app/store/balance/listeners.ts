import { Network } from '@avalabs/chains-sdk'
import { isAnyOf, TaskAbortError } from '@reduxjs/toolkit'
import BalanceService from 'services/balance/BalanceService'
import { AppListenerEffectAPI } from 'store'
import {
  Account,
  selectActiveAccount,
  setAccount,
  setAccounts
} from 'store/account'
import { onAppLocked, onAppUnlocked, onLogOut } from 'store/app'
import { addCustomToken } from 'store/customToken'
import { AppStartListening } from 'store/middleware/listener'
import {
  selectActiveNetwork,
  selectFavoriteNetworks,
  setNetworks
} from 'store/network'
import {
  selectSelectedCurrency,
  setSelectedCurrency
} from 'store/settings/currency'
import Logger from 'utils/Logger'
import { getLocalTokenId } from 'store/balance/utils'
import SentryWrapper from 'services/sentry/SentryWrapper'
import {
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
) => {
  const state = listenerApi.getState()
  const activeNetwork = selectActiveNetwork(state)

  let networksToFetch
  const activeAccount = selectActiveAccount(state)
  const accountsToFetch = activeAccount ? [activeAccount] : []

  if (fetchActiveOnly) {
    networksToFetch = [activeNetwork]
  } else {
    networksToFetch = selectFavoriteNetworks(state)
    // Just in case the active network has not been favorited
    if (!networksToFetch.map(n => n.chainId).includes(activeNetwork.chainId)) {
      networksToFetch.push(activeNetwork)
    }
  }

  onBalanceUpdateCore(
    queryStatus,
    listenerApi,
    networksToFetch,
    accountsToFetch
  )
}

const onBalanceUpdateCore = async (
  queryStatus: QueryStatus,
  listenerApi: AppListenerEffectAPI,
  networks: Network[],
  accounts: Account[]
) => {
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

  const promises = []

  for (const network of networks) {
    console.log('------>', 'network.chainName', network.chainName)
    promises.push(
      ...accounts.map(account => {
        console.log('------>', 'account.index', account.index)
        return BalanceService.getBalancesForAccount(
          network,
          account,
          currency,
          sentryTrx
        )
      })
    )
  }

  const balances = (await Promise.allSettled(promises)).reduce<Balances>(
    (acc, result) => {
      if (result.status === 'rejected') {
        Logger.warn('failed to get balance', result.reason)
        return acc
      }

      const { accountIndex, chainId, accountAddress, tokens } = result.value

      const tokensWithBalance = tokens.map(token => {
        return {
          ...token,
          localId: getLocalTokenId(token)
        } as LocalTokenWithBalance
      })
      return {
        ...acc,
        [getKey(chainId, accountAddress)]: {
          accountIndex,
          chainId,
          tokens: tokensWithBalance
        }
      }
    },
    {}
  )

  dispatch(setBalances(balances))
  dispatch(setStatus(QueryStatus.IDLE))

  SentryWrapper.finish(sentryTrx)
}

const fetchBalancePeriodically = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  action: any,
  listenerApi: AppListenerEffectAPI
) => {
  const { condition } = listenerApi

  onBalanceUpdate(QueryStatus.LOADING, listenerApi, false)

  const pollingTask = listenerApi.fork(async forkApi => {
    Logger.info('start periodic polling of balance')

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
        Logger.info('stop periodic polling of balance')
      }
    }
  })

  await condition(isAnyOf(onAppLocked, onLogOut))
  pollingTask.cancel()
}

export const addBalanceListeners = (startListening: AppStartListening) => {
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
      setAccount,
      addCustomToken,
      setNetworks
    ),
    effect: async (action, listenerApi) =>
      onBalanceUpdate(QueryStatus.LOADING, listenerApi, false)
  })
}
