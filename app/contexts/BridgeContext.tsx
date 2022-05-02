import React, {createContext, useContext, useState} from 'react';
import {
  BridgeSDKProvider,
  TrackerViewProps,
  useBridgeSDK,
} from '@avalabs/bridge-sdk';
import {useNetworkContext} from '@avalabs/wallet-react-components';
import {useLoadBridgeConfig} from 'screens/bridge/hooks/useLoadBridgeConfig';

export interface BridgeTransaction extends TrackerViewProps {
  createdAt?: Date
}

export interface BridgeState {
  bridgeTransactions: {
    [key: string]: BridgeTransaction
  }
}

const BridgeContext = createContext<{
  createBridgeTransaction(tx: TrackerViewProps): Promise<void>;
  removeBridgeTransaction(tx: TrackerViewProps): Promise<void>;
  transferAsset(): Promise<void>;
  bridgeTransactions: BridgeState['bridgeTransactions'];
}>({} as any);

export function BridgeProvider({ children }: { children: any }) {
  return (
    <BridgeSDKProvider>
      <LocalBridgeProvider>{children}</LocalBridgeProvider>
    </BridgeSDKProvider>
  )
}

export function useBridgeContext() {
  return useContext(BridgeContext)
}

function LocalBridgeProvider({children}: {children: any}) {
  useLoadBridgeConfig();

  const [bridgeState, setBridgeState] = useState<BridgeState>({
    bridgeTransactions: {}
  })

  async function transferAsset() {}

  async function createBridgeTransaction(bridgeTransaction: TrackerViewProps) {
    if (typeof bridgeTransaction.sourceTxHash !== 'string') return

    const newBridgeState = {
      ...bridgeState,
      bridgeTransactions: {
        ...bridgeState.bridgeTransactions,
        [bridgeTransaction.sourceTxHash]: {
          ...bridgeTransaction,
          createdAt:
            bridgeState.bridgeTransactions?.[bridgeTransaction.sourceTxHash]
              ?.createdAt || new Date()
        }
      }
    }

    setBridgeState(newBridgeState)
  }

  async function removeBridgeTransaction(bridgeTransaction: TrackerViewProps) {
    if (typeof bridgeTransaction.sourceTxHash !== 'string') return

    const { [bridgeTransaction.sourceTxHash]: unused, ...rest } =
      bridgeState.bridgeTransactions

    setBridgeState({ ...bridgeState, bridgeTransactions: rest })
  }

  return (
    <BridgeContext.Provider
      value={{
        ...bridgeState,
        createBridgeTransaction,
        removeBridgeTransaction,
        transferAsset,
      }}>
      {children}
    </BridgeContext.Provider>
  )
}
