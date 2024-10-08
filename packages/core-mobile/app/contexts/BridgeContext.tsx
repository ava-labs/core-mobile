import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef
} from 'react'
import {
  BridgeSDKProvider,
  BridgeTransaction,
  getMinimumConfirmations,
  trackBridgeTransaction,
  TrackerSubscription,
  useBridgeSDK
} from '@avalabs/core-bridge-sdk'
import { useDispatch, useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import {
  addBridgeTransaction,
  popBridgeTransaction,
  selectBridgeConfig,
  selectBridgeTransactions
} from 'store/bridge'
import {
  useAvalancheProvider,
  useBitcoinProvider,
  useEthereumProvider
} from 'hooks/networks/networkProviderHooks'
import { isEqual } from 'lodash'
import { Network } from '@avalabs/core-chains-sdk'
import Logger from 'utils/Logger'
import { showSnackBarCustom } from 'components/Snackbar'
import TransactionToast, {
  TransactionToastType
} from 'components/toast/TransactionToast'
import AnalyticsService from 'services/analytics/AnalyticsService'
import BridgeService from 'services/bridge/BridgeService'
import { selectIsDeveloperMode } from 'store/settings/advanced'

export type PartialBridgeTransaction = Pick<
  BridgeTransaction,
  | 'sourceChain'
  | 'sourceTxHash'
  | 'sourceStartedAt'
  | 'targetChain'
  | 'amount'
  | 'symbol'
>

interface BridgeContext {
  createBridgeTransaction(
    tx: PartialBridgeTransaction,
    network: Network
  ): Promise<void | { error: string }>
}

const bridgeContext = createContext<BridgeContext>({} as BridgeContext)

export function BridgeProvider({
  children
}: {
  children: ReactNode
}): JSX.Element {
  return (
    <BridgeSDKProvider>
      <LocalBridgeProvider>{children}</LocalBridgeProvider>
    </BridgeSDKProvider>
  )
}

export function useBridgeContext(): BridgeContext {
  return useContext(bridgeContext)
}

const TrackerSubscriptions = new Map<string, TrackerSubscription>()

function LocalBridgeProvider({
  children
}: {
  children: ReactNode
}): JSX.Element {
  const dispatch = useDispatch()
  const bridgeConfig = useSelector(selectBridgeConfig)
  const config = bridgeConfig?.config
  const activeAccount = useSelector(selectActiveAccount)
  const bridgeTransactions = useSelector(selectBridgeTransactions)
  const ethereumProvider = useEthereumProvider()
  const bitcoinProvider = useBitcoinProvider()
  const avalancheProvider = useAvalancheProvider()
  const { bridgeConfig: bridgeConfigSDK, setBridgeConfig } = useBridgeSDK()
  const isToastVisible = useRef<boolean>()

  const isDeveloperMode = useSelector(selectIsDeveloperMode)

  useEffect(() => {
    BridgeService.setBridgeEnvironment(isDeveloperMode)
  }, [isDeveloperMode])

  const removeBridgeTransaction = useCallback(
    (tx: BridgeTransaction) => {
      dispatch(popBridgeTransaction(tx.sourceTxHash))
      AnalyticsService.capture('BridgeTransferRequestSucceeded')

      if (!isToastVisible.current) {
        isToastVisible.current = true

        showSnackBarCustom({
          component: (
            <TransactionToast
              message={'Bridge Successful'}
              type={TransactionToastType.SUCCESS}
              txHash={tx.sourceTxHash}
            />
          ),
          duration: 'short',
          onClose: () => {
            isToastVisible.current = false
          }
        })
      }
    },
    [dispatch]
  )

  useEffect(() => {
    // sync bridge config in bridge sdk with ours
    // this is necessary because:
    // 1/ we don't use useBridgeConfigUpdater() any more.
    //    instead, we have a redux listener that fetches the config periodically
    // 2/ we still depend on a lot of things in the bridge sdk (avalancheAssets, ethereumAssets,...)
    if (bridgeConfig && !isEqual(bridgeConfig, bridgeConfigSDK)) {
      setBridgeConfig(bridgeConfig)
    }
  }, [bridgeConfig, bridgeConfigSDK, setBridgeConfig])

  // init tracking updates for txs
  const subscribeToTransaction = useCallback(
    async (trackedTransaction: BridgeTransaction) => {
      if (
        trackedTransaction &&
        config &&
        !TrackerSubscriptions.has(trackedTransaction.sourceTxHash) &&
        avalancheProvider &&
        ethereumProvider
      ) {
        // Start transaction tracking process (no need to await)
        try {
          const subscription = trackBridgeTransaction({
            bridgeTransaction: trackedTransaction,
            onBridgeTransactionUpdate: (tx: BridgeTransaction) => {
              // Update the transaction, even if it's complete
              // (we want to keep the tx up to date, because some Component(i.e. BridgeTransactionStatus) has local state that depends on it)
              dispatch(addBridgeTransaction(tx))

              if (tx.complete) {
                removeBridgeTransaction(tx)
              }
            },
            config,
            avalancheProvider,
            ethereumProvider,
            bitcoinProvider
          })

          TrackerSubscriptions.set(
            trackedTransaction.sourceTxHash,
            subscription
          )
        } catch (e) {
          Logger.error('failed to subscribe to transaction', e)
        }
      }
    },
    [
      avalancheProvider,
      bitcoinProvider,
      config,
      dispatch,
      ethereumProvider,
      removeBridgeTransaction
    ]
  )

  /**
   * Add a new pending bridge transaction to the background state and start the
   * transaction tracking process.
   */
  const createBridgeTransaction = useCallback(
    async (
      partialBridgeTransaction: PartialBridgeTransaction,
      network: Network
    ) => {
      if (!config || !network || !activeAccount) {
        return Promise.reject('Wallet not ready')
      }

      const {
        sourceChain,
        sourceTxHash,
        sourceStartedAt,
        targetChain,
        amount,
        symbol
      } = partialBridgeTransaction

      const addressC = activeAccount.addressC
      const addressBTC = activeAccount.addressBTC

      if (!addressBTC) return { error: 'missing addressBTC' }
      if (!addressC) return { error: 'missing addressC' }
      if (!sourceChain) return { error: 'missing sourceChain' }
      if (!sourceTxHash) return { error: 'missing sourceTxHash' }
      if (!sourceStartedAt) return { error: 'missing sourceStartedAt' }
      if (!targetChain) return { error: 'missing targetChain' }
      if (!amount) return { error: 'missing amount' }
      if (!symbol) return { error: 'missing symbol' }
      if (!config) return { error: 'missing bridge config' }
      if (bridgeTransactions[sourceTxHash])
        return { error: 'bridge tx already exists' }
      const requiredConfirmationCount = getMinimumConfirmations(
        sourceChain,
        config
      )

      const environment = network.isTestnet ? 'test' : 'main'

      const bridgeTransaction: BridgeTransaction = {
        /* from params */
        sourceChain,
        sourceTxHash,
        sourceStartedAt,
        targetChain,
        amount,
        symbol,
        /* new fields */
        addressC,
        addressBTC,
        complete: false,
        confirmationCount: 0,
        environment,
        requiredConfirmationCount
      }

      dispatch(addBridgeTransaction(bridgeTransaction))
      subscribeToTransaction(bridgeTransaction)
    },
    [
      activeAccount,
      bridgeTransactions,
      config,
      dispatch,
      subscribeToTransaction
    ]
  )

  // load pending txs from storage
  useEffect(() => {
    Object.values(bridgeTransactions).forEach(tx => {
      if (tx.complete) {
        removeBridgeTransaction(tx)
      } else {
        subscribeToTransaction(tx)
      }
    })
  }, [bridgeTransactions, subscribeToTransaction, removeBridgeTransaction])

  return (
    <bridgeContext.Provider
      value={{
        createBridgeTransaction
      }}>
      {children}
    </bridgeContext.Provider>
  )
}
