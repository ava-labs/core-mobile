import Big from 'big.js';
import {
  AssetType,
  BIG_ZERO,
  Blockchain,
  useBridgeSDK,
  useHasEnoughForGas,
  WrapStatus,
} from '@avalabs/bridge-sdk';
import {BridgeAdapter} from 'screens/bridge/hooks/useBridge';
import {useBridgeContext} from 'contexts/BridgeContext';
import {useSingularAssetBalanceEVM} from 'screens/bridge/hooks/useSingularAssetBalanceEVM';
import {useAssetBalancesEVM} from 'screens/bridge/hooks/useAssetBalancesEVM';
import {useNetworkContext, useWalletStateContext} from '@avalabs/wallet-react-components';
import {getEthereumProvider} from 'screens/bridge/utils/getEthereumProvider';
import {useCallback, useState} from 'react';

/**
 * Hook for when the bridge source chain is Ethereum
 */
export function useEthBridge(amount: Big, bridgeFee: Big): BridgeAdapter {
  const {
    currentAsset,
    currentAssetData,
    setTransactionDetails,
    currentBlockchain,
  } = useBridgeSDK();

  const isEthereumBridge = currentBlockchain === Blockchain.ETHEREUM;

  const {createBridgeTransaction, transferAsset} = useBridgeContext();
  const sourceBalance = useSingularAssetBalanceEVM(
    isEthereumBridge ? currentAssetData : undefined,
    Blockchain.ETHEREUM,
  );
  const {assetsWithBalances, loading} = useAssetBalancesEVM(
    Blockchain.ETHEREUM,
  );

  const {addresses} = useWalletStateContext()!;
  const network = useNetworkContext()?.network;
  const ethereumProvider = getEthereumProvider(network);
  const hasEnoughForNetworkFee = useHasEnoughForGas(
    isEthereumBridge ? addresses.addrC : undefined,
    ethereumProvider,
  );

  const [wrapStatus, setWrapStatus] = useState<WrapStatus>(WrapStatus.INITIAL);
  const [txHash, setTxHash] = useState<string>();

  const maximum = sourceBalance?.balance || BIG_ZERO;
  const minimum = bridgeFee?.mul(3);
  const receiveAmount = amount.gt(minimum) ? amount.minus(bridgeFee) : BIG_ZERO;

  const transfer = useCallback(async () => {
    if (!currentAssetData) {
      return Promise.reject();
    }

    const timestamp = Date.now();
    const symbol =
      currentAssetData.assetType === AssetType.NATIVE
        ? currentAssetData.wrappedAssetSymbol
        : currentAsset || '';

    //this transfer is part of the Bridge context
    // const result = await transferAsset(
    //   amount,
    //   currentAssetData,
    //   setWrapStatus,
    //   setTxHash,
    // );

    setTransactionDetails({
      tokenSymbol: symbol,
      amount,
    });
    // createBridgeTransaction({
    //   sourceChain: Blockchain.ETHEREUM,
    //   sourceTxHash: result.hash,
    //   sourceStartedAt: timestamp,
    //   targetChain: Blockchain.AVALANCHE,
    //   amount,
    //   symbol,
    // });

    return result.hash;
  }, [
    amount,
    currentAssetData,
    createBridgeTransaction,
    currentAsset,
    setTransactionDetails,
    transferAsset,
  ]);

  return {
    sourceBalance,
    assetsWithBalances,
    hasEnoughForNetworkFee,
    loading,
    receiveAmount,
    maximum,
    minimum,
    wrapStatus,
    txHash,
    transfer,
  };
}
