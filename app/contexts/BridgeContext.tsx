import React, { createContext, useContext, useEffect, useState } from 'react'
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
import {
  BTCTransactionResponse,
  PartialBridgeTransaction
} from 'screens/bridge/handlers/createBridgeTransaction'
import { getAvalancheProvider } from 'screens/bridge/utils/getAvalancheProvider'
import { getEthereumProvider } from 'screens/bridge/utils/getEthereumProvider'
import {
  BridgeState,
  defaultBridgeState
} from 'screens/bridge/utils/BridgeState'
import useSignAndIssueBtcTx from 'screens/bridge/hooks/useSignAndIssueBtcTx'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { useSelector } from 'react-redux'
import { selectActiveNetwork } from 'store/network'
import { selectActiveAccount } from 'store/accounts'
import { ChainId, Network } from '@avalabs/chains-sdk'
import networkService from 'services/network/NetworkService'

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
  signIssueBtc(
    unsignedTxHex: string
  ): Promise<BTCTransactionResponse | undefined>
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

  const config = useBridgeConfig().config
  const network = useSelector(selectActiveNetwork)
  const activeAccount = useSelector(selectActiveAccount)
  const { pendingBridgeTransactions, savePendingBridgeTransactions } =
    useApplicationContext().repo.pendingBridgeTransactions

  const { currentBlockchain } = useBridgeSDK()
  const { transferHandler, events } = useTransferAsset()
  const { signAndIssueBtcTx } = useSignAndIssueBtcTx()
  const avalancheProvider = getAvalancheProvider(network)
  const ethereumProvider = getEthereumProvider(network)
  const isMainnet = network.chainId === ChainId.AVALANCHE_MAINNET_ID
  const bitcoinProvider = networkService.getBitcoinProvider(isMainnet)

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
    savePendingBridgeTransactions(newBridgeState)
    setBridgeState(newBridgeState)
    return newBridgeState
  }

  // load pending txs from storage
  useEffect(() => {
    if (
      Object.values(pendingBridgeTransactions.bridgeTransactions).length > 0
    ) {
      const restoredState = deserializeBridgeState(pendingBridgeTransactions)
      setBridgeState(restoredState)
      Object.values(restoredState.bridgeTransactions).forEach(tx => {
        subscribeToTransaction(tx)
      })
    }
  }, [pendingBridgeTransactions, config])

  // filter tsx by network
  useEffect(() => {
    if (!network) return
    const filteredState = filterBridgeStateToNetwork(bridgeState, network)
    setBridgeTransactions(filteredState.bridgeTransactions)
  }, [network, bridgeState])

  // init tracking updates for txs
  function subscribeToTransaction(trackedTransaction: BridgeTransaction) {
    if (
      trackedTransaction &&
      config &&
      !TrackerSubscriptions.has(trackedTransaction.sourceTxHash)
    ) {
      console.log('Subscribing to tx', trackedTransaction)
      // Start transaction tracking process (no need to await)

      /**
       * bridgeTransaction: BridgeTransaction;
       *   onBridgeTransactionUpdate: (bridgeTransaction: BridgeTransaction) => void;
       *   config: AppConfig;
       *   avalancheProvider: Provider;
       *   ethereumProvider: Provider;
       *   bitcoinProvider: BlockCypherProvider;
       */
      try {
        const subscription = trackBridgeTransaction({
          bridgeTransaction: trackedTransaction,
          onBridgeTransactionUpdate: onUpdate,
          config,
          avalancheProvider,
          ethereumProvider,
          bitcoinProvider
        })

        TrackerSubscriptions.set(trackedTransaction.sourceTxHash, subscription)
      } catch (e) {
        console.log(e)
      }

      // return () => {
      //   console.log('bridge context tracker unsubscribed')
      //   TrackerSubscriptions.forEach(sub => sub.unsubscribe())
      //   TrackerSubscriptions.clear()
      // }
    }
  }

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
    partialBridgeTransaction: PartialBridgeTransaction
  ) {
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

    const addressC = activeAccount.address //todo: before -> wallet.getAddressBTC(isMainnet ? 'bitcoin' : 'testnet'); why this "bitcoin" and "testnet"?
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

    //set 1st state of this transaction
    const newBridgeState = onUpdate(bridgeTransaction)
    savePendingBridgeTransactions(newBridgeState)
    subscribeToTransaction(bridgeTransaction)
  }

  async function removeBridgeTransaction(sourceHash: string) {
    const { [sourceHash]: unused, ...rest } = bridgeState.bridgeTransactions
    const newBridgeState = {
      ...bridgeState,
      bridgeTransactions: rest
    }
    savePendingBridgeTransactions(newBridgeState)
    setBridgeState(newBridgeState)
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
  network: Network
): BridgeState {
  const isMainnet = network.chainId === ChainId.AVALANCHE_MAINNET_ID
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
