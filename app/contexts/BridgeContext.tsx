import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  AppConfig,
  BridgeSDKProvider,
  BridgeTransaction,
  getMinimumConfirmations,
  useBridgeConfig,
  useBridgeSDK,
  WrapStatus,
  trackBridgeTransaction
} from '@avalabs/bridge-sdk'
import { useLoadBridgeConfig } from 'screens/bridge/hooks/useLoadBridgeConfig'
import Big from 'big.js'
import { TransactionResponse } from '@ethersproject/abstract-provider'
import {
  ActiveNetwork,
  useAccountsContext,
  useNetworkContext
} from '@avalabs/wallet-react-components'
import { isMainnetNetwork } from '@avalabs/avalanche-wallet-sdk'
import { useTransferAsset } from 'screens/bridge/hooks/useTransferAsset'
import {
  BTCTransactionResponse,
  PartialBridgeTransaction
} from 'screens/bridge/handlers/createBridgeTransaction'
import { getAvalancheProvider } from 'screens/bridge/utils/getAvalancheProvider'
import { getEthereumProvider } from 'screens/bridge/utils/getEthereumProvider'
import { BridgeState, defaultBridgeState } from 'screens/bridge/BridgeState'
import useSignAndIssueBtcTx from 'screens/bridge/hooks/useSignAndIssueBtcTx'

export enum TransferEventType {
  WRAP_STATUS = 'wrap_status',
  TX_HASH = 'tx_hash',
  UPDATED = 'tx_updated'
}

interface BridgeContext {
  createBridgeTransaction(
    tx: PartialBridgeTransaction,
    bridgeTransactions: { [key: string]: BridgeTransaction },
    config: AppConfig,
    network: ActiveNetwork,
    addressC: string,
    addressBTC: string
  ): Promise<void | { error: string }>
  removeBridgeTransaction(tx: string): Promise<void>
  bridgeTransactions: BridgeState['bridgeTransactions']
  transferAsset: (
    amount: Big,
    asset: any,
    onStatusChange: (status: WrapStatus) => void,
    onTxHashChange: (txHash: string) => void
  ) => Promise<TransactionResponse> | undefined
  signIssueBtc(
    unsignedTxHex: string
  ): Promise<BTCTransactionResponse | undefined>
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

function LocalBridgeProvider({ children }: { children: any }) {
  useLoadBridgeConfig()
  const [trackedTransaction, setTrackedTransaction] =
    useState<BridgeTransaction>()
  const activeAccount = useAccountsContext().activeAccount
  const { currentBlockchain } = useBridgeSDK()
  const { transferHandler, events } = useTransferAsset()
  const { signAndIssueBtcTx } = useSignAndIssueBtcTx()
  const network = useNetworkContext()?.network
  const avalancheProvider = getAvalancheProvider(network)
  const ethereumProvider = getEthereumProvider(network)
  const config = useBridgeConfig().config

  const [bridgeState, setBridgeState] =
    useState<BridgeState>(defaultBridgeState)
  // Separate from bridgeState so they can be filtered to the current network
  const [bridgeTransactions, setBridgeTransactions] = useState<
    BridgeState['bridgeTransactions']
  >({})

  const onUpdate = (bt: BridgeTransaction) => {
    console.log(
      `incoming tx: ${bt?.sourceTxHash} count: ${
        bt?.confirmationCount
      } completed: ${bt?.complete} completedAt: ${
        bt?.completedAt
      } logStamp: ${Date.now()}`
    )
    const newBridgeState = {
      ...bridgeState,
      bridgeTransactions: {
        ...bridgeState.bridgeTransactions,
        [bt.sourceTxHash]: {
          ...bt,
          createdAt:
            bridgeState.bridgeTransactions?.[bt.sourceTxHash]
              ?.sourceStartedAt || new Date()
        }
      }
    }
    // setBridgeState(newBridgeState)
    setBridgeTransactions(newBridgeState.bridgeTransactions)
  }

  useEffect(() => {
    // load transactions from storage
  }, [events])

  useEffect(() => {
    if (!network) return
    const filteredState = filterBridgeStateToNetwork(bridgeState, network)
    setBridgeTransactions(filteredState.bridgeTransactions)
  }, [network])

  useEffect(() => {
    if (trackedTransaction && config) {
      console.log('bridge context tracker subscription')
      // Start transaction tracking process (no need to await)
      const subscription = trackBridgeTransaction({
        bridgeTransaction: trackedTransaction,
        onBridgeTransactionUpdate: onUpdate,
        config,
        avalancheProvider,
        ethereumProvider
      })

      return () => {
        console.log('bridge context tracker unsubscribed')
        subscription.unsubscribe()
      }
    }
  }, [trackedTransaction])

  async function transferAsset(
    amount: Big,
    asset: any,
    onStatusChange: (status: WrapStatus) => void,
    onTxHashChange: (txHash: string) => void
  ) {
    events.on(TransferEventType.WRAP_STATUS, status => {
      onStatusChange(status)
    })
    events.on(TransferEventType.TX_HASH, txHash => {
      onTxHashChange(txHash)
    })
    events.on(TransferEventType.UPDATED, bridgeTransaction => {
      console.log('updated transaction', bridgeTransaction)
    })

    return transferHandler(currentBlockchain, amount, asset)
  }

  async function signIssueBtc(
    unsignedTxHex: string
  ): Promise<BTCTransactionResponse> {
    return signAndIssueBtcTx(unsignedTxHex)
  }

  /**
   * Add a new pending bridge transaction to the background state and start the
   * transaction tracking process.
   */
  async function createBridgeTransaction(
    partialBridgeTransaction: PartialBridgeTransaction,
    bridgeTransactions: { [key: string]: BridgeTransaction },
    config: AppConfig,
    network: ActiveNetwork,
    addressC: string,
    addressBTC: string
  ) {
    const {
      sourceChain,
      sourceTxHash,
      sourceStartedAt,
      targetChain,
      amount,
      symbol
    } = partialBridgeTransaction

    if (!sourceChain) return { error: 'missing sourceChain' }
    if (!sourceTxHash) return { error: 'missing sourceTxHash' }
    if (!sourceStartedAt) return { error: 'missing sourceStartedAt' }
    if (!targetChain) return { error: 'missing targetChain' }
    if (!amount) return { error: 'missing amount' }
    if (!symbol) return { error: 'missing symbol' }
    if (!config) return { error: 'missing bridge config' }
    if (bridgeTransactions[sourceTxHash])
      return { error: 'bridge tx already exists' }

    const isMainnet = isMainnetNetwork(network.config)
    const requiredConfirmationCount = getMinimumConfirmations(
      sourceChain,
      config
    )

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
      environment: isMainnet ? 'main' : 'test',
      requiredConfirmationCount
    }

    // Save the initial version
    const error = false // Save the initial version
    // const error = await saveBridgeTransaction(bridgeTransaction);
    onUpdate(bridgeTransaction)

    setTrackedTransaction(bridgeTransaction)
  }

  //   const nextBridgeState = new Map()
  //   nextBridgeState.set(activeAccount?.wallet?.getAddressC(), newBridgeState)
  //   setBridgeState(newBridgeState)
  //   // return savePendingBridgeTransactions(nextBridgeState)
  // }

  async function removeBridgeTransaction(sourceHash: string) {
    const { [sourceHash]: unused, ...rest } = bridgeState.bridgeTransactions
    const newBridgeState = {
      ...bridgeState,
      bridgeTransactions: rest
    }
    const nextBridgeState = new Map()
    nextBridgeState.set(activeAccount?.wallet?.getAddressC(), newBridgeState)
    setBridgeState(newBridgeState)
    // return savePendingBridgeTransactions(nextBridgeState)
  }

  return (
    <bridgeContext.Provider
      value={{
        bridgeTransactions,
        createBridgeTransaction,
        removeBridgeTransaction,
        transferAsset,
        signIssueBtc
      }}>
      {children}
    </bridgeContext.Provider>
  )
}

/**
 * Deserialize bridgeState after retrieving from storage.
 * (i.e. convert Big string values back to Big)
 */
export function deserializeBridgeState(state: any): BridgeState {
  const bridgeTransactions = Object.entries<any>(
    state.bridgeTransactions
  ).reduce((txs, [txHash, tx]) => {
    txs[txHash] = {
      ...tx,
      amount: new Big(tx.amount),
      sourceNetworkFee: tx.sourceNetworkFee && new Big(tx.sourceNetworkFee),
      targetNetworkFee: tx.targetNetworkFee && new Big(tx.targetNetworkFee)
    }
    return txs
  }, {} as BridgeState['bridgeTransactions'])

  return {
    ...state,
    bridgeTransactions
  }
}

/**
 * Remove bridgeTransactions that don't belong to the given network.
 */
export function filterBridgeStateToNetwork(
  bridge: BridgeState,
  network: ActiveNetwork
): BridgeState {
  const isMainnet = isMainnetNetwork(network.config)
  const bridgeTransactions = Object.values(bridge.bridgeTransactions).reduce<
    BridgeState['bridgeTransactions']
  >((txs, btx) => {
    if (btx.environment === (isMainnet ? 'main' : 'test')) {
      txs[btx.sourceTxHash] = btx
    }
    return txs
  }, {})

  return { ...bridge, bridgeTransactions }
}
