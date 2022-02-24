import {
  Asset,
  BridgeSDKProvider,
  useBridgeSDK,
  WrapStatus,
} from '@avalabs/bridge-sdk';
import {TransactionResponse} from '@ethersproject/abstract-provider';
import React, {createContext, useContext} from 'react';
import {Big} from '@avalabs/avalanche-wallet-sdk';
import {useLoadBridgeConfig} from 'screens/bridge/hooks/useLoadBridgeConfig';

const BridgeContext = createContext<{
  transferAsset: (
    amount: Big,
    asset: Asset,
    onStatusChange: (status: WrapStatus) => void,
    onTxHashChange: (txHash: string) => void,
  ) => Promise<TransactionResponse>;
}>({} as any);

export function useBridgeContext() {
  return useContext(BridgeContext);
}

// This component is separate so it has access to useBridgeSDK
export function BridgeProvider({children}: {children: any}) {
  useLoadBridgeConfig();
  async function transferAsset(
    amount: Big,
    asset: Asset,
    onStatusChange: (status: WrapStatus) => void,
    onTxHashChange: (txHash: string) => void,
  ): Promise<TransactionResponse> {
    // const result = await transferAssetHandler(
    //   currentBlockchain,
    //   asset,
    //   amount.toString(),
    // );

    // transferEventSubscription.unsubscribe();
    return Promise.reject();
  }

  return (
    <BridgeContext.Provider value={{transferAsset}}>
      {children}
    </BridgeContext.Provider>
  );
}
