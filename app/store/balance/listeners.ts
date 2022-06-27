import { Network } from '@avalabs/chains-sdk'
import { isAnyOf } from '@reduxjs/toolkit'
import BalanceService from 'services/balance/BalanceService'
import { AppListenerEffectAPI } from 'store'
import {
  Account,
  selectAccounts,
  selectActiveAccount,
  setAccounts
} from 'store/account'
import { onAppLocked, onAppUnlocked } from 'store/app'
import { addCustomToken } from 'store/customToken'
import { AppStartListening } from 'store/middleware/listener'
import { selectActiveNetwork, selectFavoriteNetworks } from 'store/network'
import {
  selectSelectedCurrency,
  setSelectedCurrency
} from 'store/settings/currency'
import Logger from 'utils/Logger'
import {
  refetchBalance,
  getKey,
  setBalances,
  setStatus,
  selectBalanceStatus
} from './slice'
import { Balances, QueryStatus } from './types'

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

  let networksToFetch, accountsToFetch

  if (fetchActiveOnly) {
    networksToFetch = [selectActiveNetwork(state)]
    const activeAccount = selectActiveAccount(state)
    accountsToFetch = activeAccount ? [activeAccount] : []
  } else {
    networksToFetch = selectFavoriteNetworks(state)
    accountsToFetch = Object.values(selectAccounts(state))
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

  dispatch(setStatus(queryStatus))

  const currency = selectSelectedCurrency(state).toLowerCase()

  const promises = []

  for (const network of networks) {
    promises.push(
      ...accounts.map(account => {
        return BalanceService.getBalancesForAccount(network, account, currency)
      })
    )
  }

  const balances = (await Promise.allSettled(promises)).reduce<Balances>(
    (acc, result) => {
      if (result.status === 'rejected') {
        Logger.warn('failed to get balance', result.reason)
        return acc
      }

      const { accountIndex, chainId, address, tokens } = result.value

      return {
        ...acc,
        [getKey(chainId, address)]: {
          accountIndex,
          chainId,
          tokens
        }
      }
    },
    {}
  )

  dispatch(setBalances(balances))
  dispatch(setStatus(QueryStatus.IDLE))
}

const fetchBalancePeriodically = async (
  action: any,
  listenerApi: AppListenerEffectAPI
) => {
  const { condition } = listenerApi
  onBalanceUpdate(QueryStatus.LOADING, listenerApi, false)

  Logger.info('start periodic polling of balance')

  let intervalCount = 1

  const interval = setInterval(() => {
    let fetchActiveOnly
    if (intervalCount % allNetworksOperand === 0) {
      fetchActiveOnly = false
    } else {
      fetchActiveOnly = true
    }

    onBalanceUpdate(QueryStatus.POLLING, listenerApi, fetchActiveOnly)

    intervalCount += 1
  }, PollingConfig.activeNetwork)

  await condition(isAnyOf(onAppLocked))

  Logger.info('stop periodic polling of balance')
  clearInterval(interval)
}

export const addBalanceListeners = (startListening: AppStartListening) => {
  startListening({
    actionCreator: onAppUnlocked,
    effect: fetchBalancePeriodically
  })

  startListening({
    matcher: isAnyOf(
      refetchBalance,
      setSelectedCurrency,
      setAccounts,
      addCustomToken
    ),
    effect: async (action, listenerApi) =>
      onBalanceUpdate(QueryStatus.REFETCHING, listenerApi, false)
  })
}
