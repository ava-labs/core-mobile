import React, {createContext, useCallback, useContext, useState} from 'react';
import {Asset, BridgeSDKProvider, TrackerViewProps, WrapStatus} from '@avalabs/bridge-sdk';
import {useLoadBridgeConfig} from 'screens/bridge/hooks/useLoadBridgeConfig';
import {
  createBridgeTransaction as createBridgeTransactionSdk,
  PartialBridgeTransaction,
} from 'screens/bridge/handlers/createBridgeTransaction';
import {BridgeState} from 'screens/bridge/handlers/bridge';
import Big from 'big.js';
import {TransactionResponse} from '@ethersproject/abstract-provider';

export interface BridgeTransaction extends TrackerViewProps {
  createdAt?: Date
}

interface BridgeContext {
  createBridgeTransaction(tx: PartialBridgeTransaction): Promise<void>;
  removeBridgeTransaction(tx: string): Promise<void>;
  bridgeTransactions: BridgeState['bridgeTransactions'];
  transferAsset: (
    amount: Big,
    asset: Asset,
    onStatusChange: (status: WrapStatus) => void,
    onTxHashChange: (txHash: string) => void,
  ) => Promise<TransactionResponse>
}

const bridgeContext = createContext<BridgeContext>({} as any);

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

function LocalBridgeProvider({children}: {children: any}) {
  useLoadBridgeConfig();

  const [bridgeState, setBridgeState] = useState<BridgeState>({
    bridgeTransactions: {}
  })

  async function transferAsset() {}

  const createBridgeTransaction = useCallback((tx: PartialBridgeTransaction) => {
    //updates comes through listener
    return createBridgeTransactionSdk(tx).then().catch(error => {
      console.log(error);
    })
    // if (typeof bridgeTransaction.sourceTxHash !== 'string') return
    //
    // const newBridgeState = {
    //   ...bridgeState,
    //   bridgeTransactions: {
    //     ...bridgeState.bridgeTransactions,
    //     [bridgeTransaction.sourceTxHash]: {
    //       ...bridgeTransaction,
    //       createdAt:
    //         bridgeState.bridgeTransactions?.[bridgeTransaction.sourceTxHash]
    //           ?.createdAt || new Date()
    //     }
    //   }
    // }
    //
    // setBridgeState(newBridgeState)
  }, [])

  async function removeBridgeTransaction(txHash: string) {
    if (typeof bridgeTransaction.sourceTxHash !== 'string') return

    const { [bridgeTransaction.sourceTxHash]: unused, ...rest } =
      bridgeState.bridgeTransactions

    setBridgeState({ ...bridgeState, bridgeTransactions: rest })
  }

  return (
    <bridgeContext.Provider
      value={{
        ...bridgeState,
        createBridgeTransaction,
        removeBridgeTransaction,
        transferAsset,
      }}>
      {children}
    </bridgeContext.Provider>
  )
}
