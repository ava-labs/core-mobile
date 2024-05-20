import { v4 as uuidv4 } from 'uuid'
import { Network } from '@avalabs/chains-sdk'
import { Action, isAnyOf, TaskAbortError } from '@reduxjs/toolkit'
import BalanceService, {
  BalancesForAccount
} from 'services/balance/BalanceService'
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
  onNetworksFetched,
  selectActiveNetwork,
  selectFavoriteNetworks,
  toggleFavorite
} from 'store/network'
import {
  selectSelectedCurrency,
  setSelectedCurrency
} from 'store/settings/currency'
import Logger from 'utils/Logger'
import { calculateTotalBalance, getLocalTokenId } from 'store/balance/utils'
import SentryWrapper from 'services/sentry/SentryWrapper'
import {
  selectHasBeenViewedOnce,
  setViewOnce,
  ViewOnceKey
} from 'store/viewOnce'
import PrimaryActivityService from 'services/activity/PrimaryActivityService'
import NetworkService from 'services/network/NetworkService'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { ActivityResponse } from 'services/activity/types'
import { AggregatedAssetAmount } from '@avalabs/glacier-sdk'
import { Avax } from 'types'
import { isPChain, isXChain } from 'utils/network/isAvalancheNetwork'
import { BN } from 'bn.js'
import {
  fetchBalanceForAccount,
  getKey,
  refetchBalance,
  selectBalanceStatus,
  setBalances,
  setStatus
} from './slice'
import {
  Balances,
  LocalTokenWithBalance,
  PTokenWithBalance,
  QueryStatus,
  XTokenWithBalance
} from './types'

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

const AVAX_X_ID = 'AVAX-X'
const AVAX_P_ID = 'AVAX-P'

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
    currentStatus !== QueryStatus.IDLE
  ) {
    Logger.info('a balance query is already in flight')
    return
  }

  const sentryTrx = SentryWrapper.startTransaction('get-balances')

  dispatch(setStatus(queryStatus))

  const currency = selectSelectedCurrency(state).toLowerCase()

  const [firstNetwork, ...restNetworks] = networks

  // fetch the first network balances first
  if (firstNetwork === undefined) return

  const promises = accounts.map(account => {
    return BalanceService.getBalancesForAccount({
      network: firstNetwork,
      account,
      currency,
      sentryTrx
    })
  })
  const balances = await fetchBalanceForAccounts(promises)

  dispatch(setBalances(balances))

  // fetch all other network balances
  if (restNetworks.length > 0) {
    const inactiveNetworkPromises: Promise<BalancesForAccount>[] = []

    for (const n of restNetworks) {
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
  }

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
        if (isPChain(chainId)) {
          return convertToBalancePchain(token as PTokenWithBalance)
        }
        if (isXChain(chainId)) {
          return convertToBalanceXchain(token as XTokenWithBalance)
        }
        return {
          ...token,
          localId: getLocalTokenId(token)
        }
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

const maybePromptForAddingPChainToPortfolio = async (
  action: Action,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const { getState, dispatch } = listenerApi
  const state = getState()

  //check if we prompted before
  const hasPromptedToAddPChainToFavorites = selectHasBeenViewedOnce(
    ViewOnceKey.P_CHAIN_FAVORITE
  )(state)
  if (hasPromptedToAddPChainToFavorites) {
    Logger.trace('Already prompted for P-chain fav')
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
  const activities: ActivityResponse =
    await PrimaryActivityService.getActivities({
      network: avalancheNetworkP,
      address: activeAccount?.addressPVM ?? '',
      criticalConfig: undefined
    })
  if (activities.transactions.length === 0) {
    Logger.trace('No activities, skipping prompt for P-chain')
    return
  }

  Logger.info('Adding P-Chain to favorites')
  dispatch(toggleFavorite(avalancheNetworkP.chainId))
  dispatch(setViewOnce(ViewOnceKey.P_CHAIN_FAVORITE))
}

const convertToBalanceXchain = (
  token: XTokenWithBalance
): LocalTokenWithBalance => {
  const balancePerType: Record<string, Avax> = {}
  const tokenPrice = token.priceInCurrency

  const utxos: Record<string, AggregatedAssetAmount[]> = {
    unlocked: token.unlocked,
    locked: token.locked,
    atomicMemoryUnlocked: token.atomicMemoryUnlocked,
    atomicMemoryLocked: token.atomicMemoryLocked
  }

  for (const balanceType in utxos) {
    const balancesToAdd = utxos[balanceType]
    if (!balancesToAdd || !balancesToAdd.length) {
      balancePerType[balanceType] = new Avax(0)
      continue
    }

    balancesToAdd.forEach((uxto: AggregatedAssetAmount) => {
      const previousBalance = balancePerType[balanceType] ?? new Avax(0)
      const newBalance = previousBalance.add(uxto.amount)
      balancePerType[balanceType] = newBalance
    })
  }

  const totalBalance = calculateTotalBalance(utxos)
  const balanceDisplayValue = totalBalance.toFixed()
  const balanceInCurrency = Number(totalBalance.mul(tokenPrice).toFixed())
  const balanceCurrencyDisplayValue = balanceInCurrency.toFixed(2)

  const utxoBalances = {
    unlocked: balancePerType.unlocked?.toDisplay(),
    locked: balancePerType.locked?.toDisplay(),
    atomicMemoryUnlocked: balancePerType.atomicMemoryUnlocked?.toDisplay(),
    atomicMemoryLocked: balancePerType.atomicMemoryLocked?.toDisplay()
  }

  return {
    ...token,
    balanceInCurrency,
    balance: new BN(totalBalance.toSubUnit().toString()),
    balanceDisplayValue,
    balanceCurrencyDisplayValue,
    utxos: token,
    unlocked: token.unlocked,
    locked: token.locked,
    atomicMemoryUnlocked: token.atomicMemoryUnlocked,
    atomicMemoryLocked: token.atomicMemoryLocked,
    localId: AVAX_X_ID,
    utxoBalances
  }
}

const convertToBalancePchain = (
  token: PTokenWithBalance
): LocalTokenWithBalance => {
  const balancePerType: Record<string, Avax> = {}
  const tokenPrice = token.priceInCurrency
  const utxos: Record<string, AggregatedAssetAmount[]> = {
    unlockedUnstaked: token.unlockedUnstaked,
    unlockedStaked: token.unlockedStaked,
    pendingStaked: token.pendingStaked,
    lockedStaked: token.lockedStaked,
    lockedStakeable: token.lockedStakeable,
    lockedPlatform: token.lockedPlatform,
    atomicMemoryLocked: token.atomicMemoryLocked,
    atomicMemoryUnlocked: token.atomicMemoryUnlocked
  }

  for (const balanceType in utxos) {
    const balancesToAdd = utxos[balanceType]
    if (!balancesToAdd || !balancesToAdd.length) {
      balancePerType[balanceType] = new Avax(0)
      continue
    }

    balancesToAdd.forEach((uxto: AggregatedAssetAmount) => {
      const previousBalance = balancePerType[balanceType] ?? new Avax(0)
      const newBalance = previousBalance.add(uxto.amount)
      balancePerType[balanceType] = newBalance
    })
  }

  const totalBalance = calculateTotalBalance(utxos)
  const balanceDisplayValue = totalBalance.toFixed()
  const balanceInCurrency = Number(totalBalance.mul(tokenPrice).toFixed())
  const balanceCurrencyDisplayValue = balanceInCurrency.toFixed(2)

  const utxoBalances = {
    unlockedUnstaked: balancePerType.unlockedUnstaked?.toDisplay(),
    unlockedStaked: balancePerType.unlockedStaked?.toDisplay(),
    pendingStaked: balancePerType.pendingStaked?.toDisplay(),
    lockedStaked: balancePerType.lockedStaked?.toDisplay(),
    lockedStakeable: balancePerType.lockedStakeable?.toDisplay(),
    lockedPlatform: balancePerType.lockedPlatform?.toDisplay(),
    atomicMemoryLocked: balancePerType.atomicMemoryLocked?.toDisplay(),
    atomicMemoryUnlocked: balancePerType.atomicMemoryUnlocked?.toDisplay()
  }

  return {
    ...token,
    balanceInCurrency,
    balance: new BN(totalBalance.toSubUnit().toString()),
    balanceDisplayValue,
    balanceCurrencyDisplayValue,
    utxos: token,
    lockedStaked: token.lockedStaked,
    lockedStakeable: token.lockedStakeable,
    lockedPlatform: token.lockedPlatform,
    atomicMemoryLocked: token.atomicMemoryLocked,
    atomicMemoryUnlocked: token.atomicMemoryUnlocked,
    unlockedUnstaked: token.unlockedUnstaked,
    unlockedStaked: token.unlockedStaked,
    pendingStaked: token.pendingStaked,
    localId: AVAX_P_ID,
    utxoBalances
  }
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
    actionCreator: onAppUnlocked,
    effect: maybePromptForAddingPChainToPortfolio
  })
}
