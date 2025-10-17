import { Network } from '@avalabs/core-chains-sdk'
import { Action, ForkedTask, isAnyOf, TaskAbortError } from '@reduxjs/toolkit'
import BalanceService, {
  BalancesForAccount,
  BalancesForXpAddress
} from 'services/balance/BalanceService'
import { AppListenerEffectAPI, AppStartListening } from 'store/types'
import { Account } from 'store/account/types'
import {
  selectAccounts,
  selectActiveAccount,
  setAccounts,
  setActiveAccountId
} from 'store/account'
import { onAppLocked, onAppUnlocked, onLogOut } from 'store/app'
import { addCustomToken, selectAllCustomTokens } from 'store/customToken'
import {
  addCustomNetwork,
  selectEnabledNetworks,
  selectEnabledNetworksWithoutXP,
  toggleEnabledChainId
} from 'store/network/slice'
import {
  selectSelectedCurrency,
  setSelectedCurrency
} from 'store/settings/currency/slice'
import Logger from 'utils/Logger'
import {
  getLocalTokenId,
  getNetworksToFetch,
  getPollingConfig,
  XP_POLLING_INTERVAL
} from 'store/balance/utils'
import { selectHasBeenViewedOnce, setViewOnce } from 'store/viewOnce/slice'
import { ViewOnceKey } from 'store/viewOnce/types'
import NetworkService from 'services/network/NetworkService'
import {
  selectIsDeveloperMode,
  toggleDeveloperMode
} from 'store/settings/advanced/slice'
import {
  isAvmNetwork,
  isPChain,
  isPvmNetwork,
  isXChain
} from 'utils/network/isAvalancheNetwork'
import ActivityService from 'services/activity/ActivityService'
import { uuid } from 'utils/uuid'
import SentryWrapper from 'services/sentry/SentryWrapper'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { queryClient } from 'contexts/ReactQueryProvider'
import { selectIsSolanaSupportBlocked } from 'store/posthog'
import { runAfterInteractions } from 'utils/runAfterInteractions'
import { getAddressesForXP } from 'store/account/utils'
import { selectActiveWallet, selectActiveWalletId } from 'store/wallet/slice'
import { NetworkVMType } from '@avalabs/vm-module-types'
import { WalletType } from 'services/wallet/types'
import {
  Balances,
  LocalTokenWithBalance,
  QueryStatus,
  QueryType
} from './types'
import {
  fetchBalanceForAccount,
  getKey,
  refetchBalance,
  selectAllBalanceStatus,
  selectXpBalanceStatus,
  setBalances,
  setStatus
} from './slice'

export const AVAX_X_ID = 'AVAX-X'
export const AVAX_P_ID = 'AVAX-P'

const onBalanceUpdateForAccount = async (
  queryStatus: QueryStatus,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const { getState } = listenerApi
  const state = getState()
  const account = selectActiveAccount(state)
  const isDeveloperMode = selectIsDeveloperMode(state)
  const enabledNetworks = selectEnabledNetworks(state)
  const networks = getNetworksToFetch({
    isDeveloperMode,
    enabledNetworks,
    iteration: 0,
    nonPrimaryNetworksIteration: 0,
    pullPrimaryNetworks: true,
    address: account?.addressC ?? ''
  })

  onBalanceUpdateCore({
    queryStatus,
    listenerApi,
    networks,
    account
  })
}

const onBalanceUpdate = async (
  queryStatus: QueryStatus,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const { getState } = listenerApi
  const state = getState()
  const account = selectActiveAccount(state)
  const isDeveloperMode = selectIsDeveloperMode(state)
  const enabledNetworks = selectEnabledNetworksWithoutXP(state)

  const networks = getNetworksToFetch({
    isDeveloperMode,
    enabledNetworks,
    iteration: 0,
    nonPrimaryNetworksIteration: 0,
    pullPrimaryNetworks: true,
    address: account?.addressC ?? ''
  })

  onBalanceUpdateCore({
    queryStatus,
    listenerApi,
    networks,
    account
  })
  onXpBalanceUpdateCore({
    queryStatus,
    listenerApi
  })
}

const onBalancePolling = async ({
  queryStatus,
  listenerApi,
  iteration,
  pullPrimaryNetworks,
  nonPrimaryNetworksIteration
}: {
  queryStatus: QueryStatus
  listenerApi: AppListenerEffectAPI
  iteration: number
  pullPrimaryNetworks: boolean
  nonPrimaryNetworksIteration: number
}): Promise<void> => {
  const { getState } = listenerApi
  const state = getState()
  const account = selectActiveAccount(state)
  const isDeveloperMode = selectIsDeveloperMode(state)
  const enabledNetworks = selectEnabledNetworksWithoutXP(state)

  const networks = getNetworksToFetch({
    isDeveloperMode,
    enabledNetworks,
    iteration,
    nonPrimaryNetworksIteration,
    pullPrimaryNetworks,
    address: account?.addressC ?? ''
  })

  return onBalanceUpdateCore({
    queryStatus,
    listenerApi,
    networks,
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
  const currentStatus = selectAllBalanceStatus(state)

  if (
    queryStatus === QueryStatus.POLLING &&
    [QueryStatus.LOADING, QueryStatus.REFETCHING, QueryStatus.POLLING].includes(
      currentStatus
    )
  ) {
    Logger.info('a balance query is already in flight')
    return
  }

  dispatch(setStatus({ queryType: QueryType.ALL, status: queryStatus }))

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
          key: getKey(n.chainId, account.id),
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
      dispatch(
        setStatus({ queryType: QueryType.ALL, status: QueryStatus.IDLE })
      )
      span?.end()
    }
  )
}

const onXpBalanceUpdateCore = async ({
  queryStatus,
  listenerApi
}: {
  queryStatus: QueryStatus
  listenerApi: AppListenerEffectAPI
}): Promise<void> => {
  const { getState, dispatch } = listenerApi
  const state = getState()
  const currentStatus = selectXpBalanceStatus(state)
  const enabledNetworks = selectEnabledNetworks(state)
  const isDeveloperMode = selectIsDeveloperMode(state)
  const walletId = selectActiveWalletId(state)
  const wallet = selectActiveWallet(state)
  const accounts = selectAccounts(state)

  const networks = enabledNetworks.filter(
    n => isPvmNetwork(n) || isAvmNetwork(n)
  )

  if (
    queryStatus === QueryStatus.POLLING &&
    [QueryStatus.LOADING, QueryStatus.REFETCHING, QueryStatus.POLLING].includes(
      currentStatus
    )
  ) {
    Logger.info('a xp balance query is already in flight')
    return
  }

  dispatch(setStatus({ queryType: QueryType.XP, status: queryStatus }))

  const currency = selectSelectedCurrency(state).toLowerCase()

  SentryWrapper.startSpan(
    { name: 'get-balances', contextName: 'svc.balance.get_for_xp_networks' },
    async span => {
      Logger.info('fetching xp balances')

      const xpPromises: {
        addresses: string[]
        promise: Promise<BalancesForXpAddress[]>
      }[] = []
      for (const n of networks) {
        let addresses: string[] = []
        if (wallet?.type === WalletType.SEEDLESS) {
          addresses = Object.values(accounts).map(a =>
            n.vmName === NetworkVMType.PVM ? a.addressPVM : a.addressAVM
          )
        } else {
          addresses = await getAddressesForXP({
            networkType: n.vmName,
            isDeveloperMode,
            walletId,
            walletType: wallet?.type,
            onlyWithActivity: true
          })
        }
        xpPromises.push({
          addresses,
          promise: BalanceService.getXPBalances({
            network: n,
            currency,
            addresses
          })
        })
      }

      const xpBalances = await fetchBalanceForXpNetworks(xpPromises)

      dispatch(setBalances(xpBalances))
      dispatch(setStatus({ queryType: QueryType.XP, status: QueryStatus.IDLE }))
      Logger.info('finished fetching xp balances')
      span?.end()
    }
  )
}

const fetchBalancePeriodically = async (
  _: Action,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const { condition, getState } = listenerApi
  const state = getState()
  const selectedEnabledNetworks = selectEnabledNetworks(state)
  const isSolanaSupportBlocked = selectIsSolanaSupportBlocked(state)

  if (selectedEnabledNetworks.length === 0) {
    // when the app is first launched, there are no networks cached yet,
    // so we need to wait for the networks to be fetched
    // before we can start polling
    await queryClient.prefetchQuery({
      queryKey: [ReactQueryKeys.NETWORKS, !isSolanaSupportBlocked],
      queryFn: () =>
        NetworkService.getNetworks({
          includeSolana: !isSolanaSupportBlocked
        })
    })
  }

  const [pollingAllNetworksTask, pollingXpNetworksTask] = await Promise.all([
    handleAllNetworksPolling({ listenerApi }),
    handleXpNetworksPolling({ listenerApi })
  ])

  await condition(isAnyOf(onAppLocked, onLogOut))
  pollingAllNetworksTask.cancel()
  pollingXpNetworksTask.cancel()
}

const handleXpNetworksPolling = async ({
  listenerApi
}: {
  listenerApi: AppListenerEffectAPI
}): Promise<ForkedTask<void>> => {
  const taskId = uuid().slice(0, 8)
  Logger.info(`started task ${taskId}`, 'fetch xp balances periodically')

  return listenerApi.fork(async forkApi => {
    try {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        await forkApi.pause(
          runAfterInteractions(async () => {
            await onXpBalanceUpdateCore({
              queryStatus: QueryStatus.POLLING,
              listenerApi
            })
          })
        )

        // cancellation-aware delay
        await forkApi.delay(XP_POLLING_INTERVAL)
      }
    } catch (err) {
      if (err instanceof TaskAbortError) {
        // task got cancelled or the listener got cancelled
        Logger.info(`stopped task ${taskId}`)
      }
    }
  })
}

const handleAllNetworksPolling = async ({
  listenerApi
}: {
  listenerApi: AppListenerEffectAPI
}): Promise<ForkedTask<void>> => {
  const { getState } = listenerApi
  const state = getState()
  const isDeveloperMode = selectIsDeveloperMode(state)
  const enabledNetworks = selectEnabledNetworksWithoutXP(state)

  let iteration = 0
  let nonPrimaryNetworksIteration = 0

  const pollingConfig = getPollingConfig({ isDeveloperMode, enabledNetworks })

  const allNetworksOperand =
    pollingConfig.allNetworks / pollingConfig.primaryNetworks

  return listenerApi.fork(async forkApi => {
    const taskId = uuid().slice(0, 8)
    Logger.info(`started task ${taskId}`, 'fetch balances periodically')

    try {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        let pullPrimaryNetworks

        if (iteration % allNetworksOperand === 0) {
          pullPrimaryNetworks = false
        } else {
          pullPrimaryNetworks = true
        }

        // cancellation-aware wait for the balance update to be done
        await forkApi.pause(
          runAfterInteractions(async () => {
            await onBalancePolling({
              queryStatus: QueryStatus.POLLING,
              listenerApi,
              iteration,
              pullPrimaryNetworks,
              nonPrimaryNetworksIteration
            })
          })
        )

        iteration += 1

        if (pullPrimaryNetworks === false) {
          nonPrimaryNetworksIteration += 1
        }

        // cancellation-aware delay
        await forkApi.delay(pollingConfig.primaryNetworks)
      }
    } catch (err) {
      if (err instanceof TaskAbortError) {
        // task got cancelled or the listener got cancelled
        Logger.info(`stopped task ${taskId}`)
      }
    }
  })
}

const handleFetchBalanceForAccount = async (
  listenerApi: AppListenerEffectAPI,
  account: Account
): Promise<void> => {
  const state = listenerApi.getState()
  const isDeveloperMode = selectIsDeveloperMode(state)
  const enabledNetworks = selectEnabledNetworksWithoutXP(state)

  const networks = getNetworksToFetch({
    isDeveloperMode,
    enabledNetworks,
    iteration: 0,
    nonPrimaryNetworksIteration: 0,
    pullPrimaryNetworks: true,
    address: account.addressC ?? ''
  })

  onBalanceUpdateCore({
    queryStatus: QueryStatus.LOADING,
    listenerApi,
    networks,
    account
  }).catch(Logger.error)
}

const fetchBalanceForNetworks = async (
  keyedPromises: { promise: Promise<BalancesForAccount>; key: string }[]
): Promise<Balances> => {
  const keys = keyedPromises.map(value => value.key)
  return (
    await Promise.allSettled(keyedPromises.map(value => value.promise))
  ).reduce<Balances>((acc, result, i) => {
    const key: string = keys[i] ?? ''

    if (result.status === 'rejected') {
      Logger.warn('failed to get balance', result.reason)
      acc[key] = {
        dataAccurate: false,
        accountId: undefined,
        chainId: 0,
        tokens: [],
        error: result.reason
      }
      return acc
    }

    const { accountId, chainId, tokens, error } = result.value

    const balances = {
      dataAccurate: true,
      accountId,
      chainId,
      tokens: [] as LocalTokenWithBalance[],
      error
    }

    balances.tokens = tokens.reduce((tokenBalance, token) => {
      if ('error' in token) {
        balances.dataAccurate = false
        return {
          ...tokenBalance,
          isDataAccurate: false,
          networkChainId: chainId,
          error: token.error
        }
      }
      if (isPChain(chainId)) {
        return [
          ...tokenBalance,
          {
            ...token,
            localId: AVAX_P_ID,
            isDataAccurate: true,
            networkChainId: chainId,
            error: null
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
            networkChainId: chainId,
            error: null
          }
        ]
      }
      return [
        ...tokenBalance,
        {
          ...token,
          localId: getLocalTokenId(token),
          isDataAccurate: true,
          networkChainId: chainId,
          error: null
        }
      ]
    }, [] as LocalTokenWithBalance[])

    acc[key] = balances

    return acc
  }, {})
}

const fetchBalanceForXpNetworks = async (
  promises: {
    addresses: string[]
    promise: Promise<BalancesForXpAddress[]>
  }[]
): Promise<Balances> => {
  const allSettledResults = await Promise.allSettled(
    promises.map(p => p.promise)
  )

  const allBalances: Balances = {}
  allSettledResults.forEach((result, index) => {
    const addresses = promises[index]?.addresses ?? []

    // if the promise is rejected, set the balances for the active addresses
    if (result.status === 'rejected') {
      Logger.warn('failed to get balance', result.reason)
      addresses.forEach(address => {
        allBalances[address] = {
          dataAccurate: false,
          accountId: undefined,
          chainId: 0,
          tokens: [],
          error: result.reason
        }
      })
      return
    }

    // add the balances for the active addresses to allBalances
    result.value.forEach(balance => {
      allBalances[balance.accountAddress] = {
        accountId: undefined,
        dataAccurate: true,
        chainId: balance.chainId,
        tokens: balance.tokens.map(token => ({
          ...token,
          localId: isPChain(balance.chainId) ? AVAX_P_ID : AVAX_X_ID,
          isDataAccurate: 'error' in token ? false : true,
          networkChainId: balance.chainId,
          error: 'error' in token ? token.error : null
        })) as LocalTokenWithBalance[],
        error: balance.error
      }
    })
  })
  return allBalances
}

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
      setActiveAccountId,
      toggleEnabledChainId,
      toggleDeveloperMode
    ),
    effect: async (_, listenerApi) =>
      onBalanceUpdate(QueryStatus.LOADING, listenerApi)
  })

  startListening({
    matcher: isAnyOf(addCustomToken, addCustomNetwork),
    effect: async (_, listenerApi) =>
      onBalanceUpdateForAccount(QueryStatus.LOADING, listenerApi)
  })

  startListening({
    actionCreator: fetchBalanceForAccount,
    effect: async (action, listenerApi) =>
      handleFetchBalanceForAccount(listenerApi, action.payload.account)
  })

  startListening({
    matcher: isAnyOf(onAppUnlocked, setAccounts),
    effect: addXChainToEnabledChainIdsIfNeeded
  })
}
