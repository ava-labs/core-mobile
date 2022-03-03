import {
  Asset,
  BridgeSDKProvider,
  useBridgeConfigUpdater,
  useBridgeSDK,
  WrapStatus,
} from '@avalabs/bridge-sdk';
import {TransactionResponse} from '@ethersproject/abstract-provider';
import {createContext, useCallback, useContext, useEffect} from 'react';
import {Big} from '@avalabs/avalanche-wallet-sdk';
import {TransferEventType} from './Models';
import {transferAssetHandler} from 'screens/bridge/transferAssets';
import {getBridgeConfig} from 'screens/bridge/bridgeConfig';
import {useNetworkContext} from '@avalabs/wallet-react-components';
import React from 'react';

const BridgeContext = createContext<{
  transferAsset: (
    amount: Big,
    asset: Asset,
    onStatusChange: (status: WrapStatus) => void,
    onTxHashChange: (txHash: string) => void,
  ) => Promise<TransactionResponse>;
}>({} as any);

export function BridgeProvider({children}: {children: any}) {
  return (
    <BridgeSDKProvider>
      <InnerBridgeProvider>{children}</InnerBridgeProvider>
    </BridgeSDKProvider>
  );
}

export function useBridgeContext() {
  return useContext(BridgeContext);
}

// This component is separate so it has access to useBridgeSDK
function InnerBridgeProvider({children}: {children: any}) {
  useSyncConfig();

  const {currentBlockchain} = useBridgeSDK();

  async function transferAsset(
    amount: Big,
    asset: Asset,
    onStatusChange: (status: WrapStatus) => void,
    onTxHashChange: (txHash: string) => void,
  ) {
    // const transferEventSubscription = events()
    //   .pipe(
    //     filter(isBridgeTransferEventListener),
    //     map(evt => evt.value),
    //   )
    //   .subscribe(event => {
    //     event.type === TransferEventType.WRAP_STATUS
    //       ? onStatusChange(event.status)
    //       : onTxHashChange(event.txHash);
    //   });

    const result = await transferAssetHandler(
      currentBlockchain,
      asset,
      amount.toString(),
    );

    // transferEventSubscription.unsubscribe();
    return result;
  }

  return (
    <BridgeContext.Provider
      value={{
        transferAsset,
      }}>
      {children}
    </BridgeContext.Provider>
  );
}

/**
 * Periodically update the bridge config and keep it in sync with the background.
 */
async function useSyncConfig() {
  const {setBridgeConfig} = useBridgeSDK();
  const networkState = useNetworkContext();
  const fetchConfig = useCallback(() => getBridgeConfig(), [networkState]);

  // periodically update the bridge config
  useBridgeConfigUpdater(fetchConfig);

  // update the bridge config when the network changes
  useEffect(() => {
    (async () => {
      const newConfig = await fetchConfig();
      setBridgeConfig(newConfig);
    })();
  }, [networkState]);
}
