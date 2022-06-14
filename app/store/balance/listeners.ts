import { isAnyOf } from '@reduxjs/toolkit'
import BalanceService from 'services/balance/BalanceService'
import { AppListenerEffectAPI } from 'store'
import { selectAccounts } from 'store/account'
import { onAppLocked, onAppUnlocked } from 'store/app'
import { AppStartListening } from 'store/middleware/listener'
import { selectFavoriteNetworks } from 'store/network'
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

const POLLING_INTERVAL = 20000

const onBalanceUpdate = async (
  queryStatus: QueryStatus,
  listenerApi: AppListenerEffectAPI
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
  const activeNetworks = selectFavoriteNetworks(state)
  const accounts = Object.values(selectAccounts(state))

  const promises = []

  for (const network of activeNetworks) {
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
  onBalanceUpdate(QueryStatus.LOADING, listenerApi)

  Logger.info('start periodic polling of balance')

  const interval = setInterval(() => {
    onBalanceUpdate(QueryStatus.POLLING, listenerApi)
  }, POLLING_INTERVAL)

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
    matcher: isAnyOf(refetchBalance, setSelectedCurrency),
    effect: async (action, listenerApi) =>
      onBalanceUpdate(QueryStatus.REFETCHING, listenerApi)
  })
}
