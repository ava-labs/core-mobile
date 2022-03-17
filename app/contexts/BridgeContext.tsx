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

// export const defaultBridgeState: BridgeState = {
//   bridgeTransactions: {},
// };

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
  const [bridgeTransactions, setBridgeTransactions] = useState<BridgeState>({
    bridgeTransactions: {},
  });

  async function createBridgeTransaction(bridgeTransaction: TrackerViewProps) {
    const newBridgeState = {
      ...bridgeTransactions,
      bridgeTransactions: {
        ...bridgeTransactions.bridgeTransactions,
        [bridgeTransaction.sourceTxHash]: {
          ...bridgeTransaction,
          createdAt:
            bridgeTransactions.bridgeTransactions?.[
              bridgeTransaction.sourceTxHash
            ]?.createdAt || new Date(),
        },
      },
    };

    setBridgeTransactions(newBridgeState);
  }

  async function removeBridgeTransaction(bridgeTransaction: TrackerViewProps) {
    const {[bridgeTransaction.sourceTxHash]: unused, ...rest} =
      bridgeTransactions.bridgeTransactions;
    setBridgeTransactions({...bridgeTransactions, bridgeTransactions: rest});
  }

  return (
    <BridgeContext.Provider
      value={{
        ...bridgeTransactions,
        createBridgeTransaction,
        removeBridgeTransaction,
      }}>
      {children}
    </BridgeContext.Provider>
  );
}
