import React, { ReactNode, useCallback, useEffect } from 'react'
import {
  BridgeSDKProvider,
  BridgeTransaction,
  trackBridgeTransaction,
  TrackerSubscription,
  useBridgeSDK
} from '@avalabs/core-bridge-sdk'
import { useDispatch, useSelector } from 'react-redux'
import {
  addBridgeTransaction,
  popBridgeTransaction,
  selectBridgeConfig,
  selectBridgeTransactions
} from 'store/bridge'
import {
  useAvalancheEvmProvider,
  useBitcoinProvider,
  useEthereumProvider
} from 'hooks/networks/networkProviderHooks'
import { isEqual } from 'lodash'
import Logger from 'utils/Logger'
import AnalyticsService from 'services/analytics/AnalyticsService'
import BridgeService from 'services/bridge/BridgeService'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { transactionSnackbar } from 'common/utils/toast'

export type PartialBridgeTransaction = Pick<
  BridgeTransaction,
  | 'sourceChain'
  | 'sourceTxHash'
  | 'sourceStartedAt'
  | 'targetChain'
  | 'amount'
  | 'symbol'
>

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

const TrackerSubscriptions = new Map<string, TrackerSubscription>()

function LocalBridgeProvider({
  children
}: {
  children: ReactNode
}): JSX.Element {
  const dispatch = useDispatch()
  const bridgeConfig = useSelector(selectBridgeConfig)
  const config = bridgeConfig?.config
  const bridgeTransactions = useSelector(selectBridgeTransactions)
  const ethereumProvider = useEthereumProvider()
  const bitcoinProvider = useBitcoinProvider()
  const avalancheProvider = useAvalancheEvmProvider()
  const { bridgeConfig: bridgeConfigSDK, setBridgeConfig } = useBridgeSDK()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)

  useEffect(() => {
    BridgeService.setBridgeEnvironment(isDeveloperMode)
  }, [isDeveloperMode])

  const removeBridgeTransaction = useCallback(
    (tx: BridgeTransaction) => {
      dispatch(popBridgeTransaction(tx.sourceTxHash))
      AnalyticsService.capture('BridgeTransferRequestSucceeded')

      transactionSnackbar.success({ message: 'Bridge successful' })
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
        ethereumProvider &&
        bitcoinProvider
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

  return <>{children}</>
}
