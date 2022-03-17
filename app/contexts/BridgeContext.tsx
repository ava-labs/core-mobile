import React, {createContext, useContext, useState} from 'react';
import {BridgeSDKProvider, TrackerViewProps} from '@avalabs/bridge-sdk';

export interface BridgeTransaction extends TrackerViewProps {
  createdAt?: Date;
}

export interface BridgeState {
  bridgeTransactions: {
    [key: string]: BridgeTransaction;
  };
}

const BridgeContext = createContext<{
  createBridgeTransaction(tx: TrackerViewProps): Promise<void>;
  removeBridgeTransaction(tx: TrackerViewProps): Promise<void>;
  bridgeTransactions: BridgeState['bridgeTransactions'];
}>({} as any);

export function BridgeProvider({children}: {children: any}) {
  return (
    <BridgeSDKProvider>
      <LocalBridgeProvider>{children}</LocalBridgeProvider>
    </BridgeSDKProvider>
  );
}

export function useBridgeContext() {
  return useContext(BridgeContext);
}

function LocalBridgeProvider({children}: {children: any}) {
  const [bridgeState, setBridgeState] = useState<BridgeState>({
    bridgeTransactions: {},
  });

  async function createBridgeTransaction(bridgeTransaction: TrackerViewProps) {
    const newBridgeState = {
      ...bridgeState,
      bridgeTransactions: {
        ...bridgeState.bridgeTransactions,
        [bridgeTransaction.sourceTxHash]: {
          ...bridgeTransaction,
          createdAt:
            bridgeState.bridgeTransactions?.[bridgeTransaction.sourceTxHash]
              ?.createdAt || new Date(),
        },
      },
    };

    setBridgeState(newBridgeState);
  }

  async function removeBridgeTransaction(bridgeTransaction: TrackerViewProps) {
    const {[bridgeTransaction.sourceTxHash]: unused, ...rest} =
      bridgeState.bridgeTransactions;

    setBridgeState({...bridgeState, bridgeTransactions: rest});
  }

  return (
    <BridgeContext.Provider
      value={{
        ...bridgeState,
        createBridgeTransaction,
        removeBridgeTransaction,
      }}>
      {children}
    </BridgeContext.Provider>
  );
}
