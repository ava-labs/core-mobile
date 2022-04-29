import {BridgeTransaction} from '@avalabs/bridge-sdk';
import {BehaviorSubject, firstValueFrom} from 'rxjs';
import {Big, isMainnetNetwork} from '@avalabs/avalanche-wallet-sdk';
import {ActiveNetwork} from '@avalabs/wallet-react-components';

export interface BridgeState {
  bridgeTransactions: {
    [key: string]: BridgeTransaction
  }
}

export const defaultBridgeState: BridgeState = {
  bridgeTransactions: {},
};

export const bridge$ = new BehaviorSubject<BridgeState>(defaultBridgeState);

export async function saveBridgeTransaction(
  bridgeTransaction: BridgeTransaction
) {
  const bridgeState = await firstValueFrom(bridge$);
  const bridgeTransactions = bridgeState.bridgeTransactions;

  const nextBridgeState = {
    ...bridgeState,
    bridgeTransactions: {
      ...bridgeTransactions,
      [bridgeTransaction.sourceTxHash]: bridgeTransaction,
    },
  };
  const [, error] = await Promise.resolve(saveBridgeStateToStorage(nextBridgeState));
  bridge$.next(nextBridgeState);

  return error;
}

export async function removeBridgeTransaction(sourceTxHash: string) {
  const bridgeState = await firstValueFrom(bridge$);
  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    [sourceTxHash]: _removed,
    ...bridgeTransactions
  } = bridgeState.bridgeTransactions;

  const nextBridgeState = { ...bridgeState, bridgeTransactions };
  const [, error] = await Promise.resolve(saveBridgeStateToStorage(nextBridgeState));
  bridge$.next(nextBridgeState);

  return error;
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
      targetNetworkFee: tx.targetNetworkFee && new Big(tx.targetNetworkFee),
    };
    return txs;
  }, {} as BridgeState['bridgeTransactions']);

  return {
    ...state,
    bridgeTransactions,
  };
}

/**
 * Remove bridgeTransactions that don't belong to the given network.
 */
export function filterBridgeStateToNetwork(
  bridge: BridgeState,
  network: ActiveNetwork
): BridgeState {
  const isMainnet = isMainnetNetwork(network.config);
  const bridgeTransactions = Object.values(bridge.bridgeTransactions).reduce<
    BridgeState['bridgeTransactions']
    >((txs, btx) => {
    if (btx.environment === (isMainnet ? 'main' : 'test')) {
      txs[btx.sourceTxHash] = btx;
    }
    return txs;
  }, {});

  return { ...bridge, bridgeTransactions };
}
