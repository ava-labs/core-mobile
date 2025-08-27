import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback
} from 'react'
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
  selectBridgeTransactions
} from 'store/bridge'
import { useBridgeConfig } from 'hooks/bridge/useBridgeConfig'
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

// Create a simple context for controlling config fetching
const BridgeConfigContext = createContext<{
  enableConfig: () => void
  disableConfig: () => void
}>({
  enableConfig: () => {}, // eslint-disable-line @typescript-eslint/no-empty-function
  disableConfig: () => {} // eslint-disable-line @typescript-eslint/no-empty-function
})

export function BridgeProvider({
  children
}: {
  children: ReactNode
}): JSX.Element {
  const [configEnabled, setConfigEnabled] = useState(false)

  const enableConfig = () => setConfigEnabled(true)
  const disableConfig = () => setConfigEnabled(false)

  return (
    <BridgeConfigContext.Provider value={{ enableConfig, disableConfig }}>
      <BridgeSDKProvider>
        <LocalBridgeProvider enabled={configEnabled}>
          {children}
        </LocalBridgeProvider>
      </BridgeSDKProvider>
    </BridgeConfigContext.Provider>
  )
}

const TrackerSubscriptions = new Map<string, TrackerSubscription>()

function LocalBridgeProvider({
  children,
  enabled
}: {
  children: ReactNode
  enabled: boolean
}): JSX.Element {
  const dispatch = useDispatch()
  const { data: bridgeConfig } = useBridgeConfig(enabled)
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
    // 1/ we now use useBridgeConfig hook with MMKV caching instead of Redux
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

// Export hook to control config fetching
export const useBridgeConfigControl = () => useContext(BridgeConfigContext)
