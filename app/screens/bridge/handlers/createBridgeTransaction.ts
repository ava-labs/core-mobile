import { Big, isMainnetNetwork } from '@avalabs/avalanche-wallet-sdk';
import {
  BridgeTransaction,
  getMinimumConfirmations, useBridgeConfig,
} from '@avalabs/bridge-sdk';
import {
  network$,
  wallet$,
  walletState$,
} from '@avalabs/wallet-react-components';

import { firstValueFrom } from 'rxjs';
import {trackBridgeTransaction} from 'screens/bridge/handlers/trackBridgeTransactions';

export type PartialBridgeTransaction = Pick<
  BridgeTransaction,
  | 'sourceChain'
  | 'sourceTxHash'
  | 'sourceStartedAt'
  | 'targetChain'
  | 'amount'
  | 'symbol'
  >;

/**
 * Add a new pending bridge transaction to the background state and start the
 * transaction tracking process.
 */
export async function createBridgeTransaction(partialBridgeTransaction: PartialBridgeTransaction) {

  const {
    sourceChain,
    sourceTxHash,
    sourceStartedAt,
    targetChain,
    amount: amountStr,
    symbol,
  } = partialBridgeTransaction;

  const config = useBridgeConfig().config;

  if (!sourceChain) return { error: 'missing sourceChain' };
  if (!sourceTxHash) return { error: 'missing sourceTxHash' };
  if (!sourceStartedAt) return { error: 'missing sourceStartedAt' };
  if (!targetChain) return { error: 'missing targetChain' };
  if (!amountStr) return { error: 'missing amount' };
  if (!symbol) return { error: 'missing symbol' };

  // const { config } = await firstValueFrom(bridgeConfig$);
  if (!config) return { error: 'missing bridge config' };

  const bridgeState = await firstValueFrom(bridge$);
  const bridgeTransactions = bridgeState.bridgeTransactions;

  const network = await firstValueFrom(network$);
  const wallet = await firstValueFrom(wallet$);
  const walletState = await firstValueFrom(walletState$);
  if (!wallet || !walletState || !network)
    return { error: 'wallet not ready' };

  if (bridgeTransactions[sourceTxHash])
    return { error: 'bridge tx already exists' };

  const addressC = walletState.addresses.addrC;
  const isMainnet = isMainnetNetwork(network.config);
  const addressBTC = wallet.getAddressBTC(isMainnet ? 'bitcoin' : 'testnet');
  const amount = new Big(amountStr);
  const requiredConfirmationCount = getMinimumConfirmations(
    sourceChain,
    config
  );

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
    requiredConfirmationCount,
  };

  // Save the initial version
  const error = false; // Save the initial version
  // const error = await saveBridgeTransaction(bridgeTransaction);

  // Start transaction tracking process (no need to await)
  trackBridgeTransaction(bridgeTransaction, config);

  if (error) {
    return {
      error,
    };
  }

  return {
    result: true,
  };
}

