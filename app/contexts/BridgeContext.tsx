import React, { createContext, useCallback, useContext, useEffect } from 'react'
import {
  BridgeSDKProvider,
  BridgeTransaction,
  getMinimumConfirmations,
  trackBridgeTransaction,
  TrackerSubscription,
  useBridgeConfig,
  useBridgeSDK,
  WrapStatus
} from '@avalabs/bridge-sdk'
import { useLoadBridgeConfig } from 'screens/bridge/hooks/useLoadBridgeConfig'
import Big from 'big.js'
import { TransactionResponse } from '@ethersproject/abstract-provider'
import { useTransferAsset } from 'screens/bridge/hooks/useTransferAsset'
import { PartialBridgeTransaction } from 'screens/bridge/handlers/createBridgeTransaction'
import { BridgeReducerState, BridgeState } from 'store/bridge/types'
import { useDispatch, useSelector } from 'react-redux'
import { selectActiveNetwork } from 'store/network'
import { selectActiveAccount } from 'store/account'
import {
  addBridgeTransaction,
  popBridgeTransaction,
  selectBridgeTransactions
} from 'store/bridge'
import { selectIsReady } from 'store/app'
import {
  useAvalancheProvider,
  useBitcoinProvider,
  useEthereumProvider
} from 'hooks/networkProviderHooks'

export enum TransferEventType {
  WRAP_STATUS = 'wrap_status',
  TX_HASH = 'tx_hash',
  UPDATED = 'tx_updated'
}

interface BridgeContext {
  createBridgeTransaction(
    tx: PartialBridgeTransaction
  ): Promise<void | { error: string }>

  removeBridgeTransaction(tx: string): Promise<void>

  bridgeTransactions: BridgeState['bridgeTransactions']
  transferAsset: (
    amount: Big,
    asset: any,
    onStatusChange: (status: WrapStatus) => void,
    onTxHashChange: (txHash: string) => void
  ) => Promise<TransactionResponse | undefined>
}

const bridgeContext = createContext<BridgeContext>({} as any)

export function BridgeProvider({ children }: { children: any }) {
  return (
    <BridgeSDKProvider>
      <LocalBridgeProvider>{children}</LocalBridgeProvider>
    </BridgeSDKProvider>
  )
}

export function useBridgeContext() {
  return useContext(bridgeContext)
}

const TrackerSubscriptions = new Map<string, TrackerSubscription>()

function LocalBridgeProvider({ children }: { children: any }) {
  useLoadBridgeConfig()
  const dispatch = useDispatch()
  const config = useBridgeConfig().config
  const network = useSelector(selectActiveNetwork)
  const activeAccount = useSelector(selectActiveAccount)
  const bridgeTransactions = useSelector(selectBridgeTransactions)
  const hydrationComplete = useSelector(selectIsReady)
  const { currentBlockchain } = useBridgeSDK()
  const { transferHandler, events } = useTransferAsset()
  const ethereumProvider = useEthereumProvider()
  const bitcoinProvider = useBitcoinProvider()
  const avalancheProvider = useAvalancheProvider()

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
            onBridgeTransactionUpdate: (tx: BridgeTransaction) =>
              dispatch(addBridgeTransaction(tx)),
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
          console.log(e)
        }
      }
    },
    [avalancheProvider, bitcoinProvider, config, dispatch, ethereumProvider]
  )

  const transferAsset = useCallback(
    async (
      amount: Big,
      asset: any,
      onStatusChange: (status: WrapStatus) => void,
      onTxHashChange: (txHash: string) => void
    ) => {
      events.on(TransferEventType.WRAP_STATUS, status => {
        onStatusChange(status)
      })
      events.on(TransferEventType.TX_HASH, txHash => {
        onTxHashChange(txHash)
      })

      return transferHandler(currentBlockchain, amount, asset)
    },
    [currentBlockchain, events, transferHandler]
  )

  /**
   * Add a new pending bridge transaction to the background state and start the
   * transaction tracking process.
   */
  const createBridgeTransaction = useCallback(
    async (partialBridgeTransaction: PartialBridgeTransaction) => {
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

      const addressC = activeAccount.address
      const addressBTC = activeAccount.addressBtc

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
      network,
      subscribeToTransaction
    ]
  )

  const removeBridgeTransaction = useCallback(
    async (sourceHash: string) => {
      dispatch(popBridgeTransaction(sourceHash))
    },
    [dispatch]
  )

  // load pending txs from storage
  useEffect(() => {
    if (Object.values(bridgeTransactions).length > 0) {
      Object.values(bridgeTransactions).forEach(tx => {
        subscribeToTransaction(tx as BridgeTransaction)
      })
    }
  }, [hydrationComplete, config, bridgeTransactions, subscribeToTransaction])

  return (
    <bridgeContext.Provider
      value={{
        bridgeTransactions,
        createBridgeTransaction,
        removeBridgeTransaction,
        transferAsset
      }}>
      {children}
    </bridgeContext.Provider>
  )
}

/**
 * Deserialize bridgeState after retrieving from storage.
 * (i.e. convert Big string values back to Big)
 */
export function deserializeBridgeState(state: BridgeReducerState) {
  const bridgeTransactions = Object.entries(
    state.bridge.bridgeTransactions
  ).reduce<Record<string, BridgeTransaction>>((txs, [txHash, tx]) => {
    txs[txHash] = {
      ...tx,
      amount: new Big(tx.amount),
      sourceNetworkFee: tx.sourceNetworkFee && new Big(tx.sourceNetworkFee),
      targetNetworkFee: tx.targetNetworkFee && new Big(tx.targetNetworkFee)
    }
    return txs
  }, {})

  return {
    ...state,
    bridge: {
      ...state.bridge,
      bridgeTransactions: bridgeTransactions
    }
  }
}
