import {ParaSwap} from 'paraswap';
import {
  network$,
  FUJI_NETWORK,
  ActiveNetwork,
  MAINNET_NETWORK,
} from '@avalabs/wallet-react-components';
import {filter, map, OperatorFunction} from 'rxjs';
import Web3 from 'web3';

export const NETWORK_UNSUPPORTED_ERROR = new Error(
  'Fuji network is not supported by Paraswap',
);

export const paraSwap$ = network$.pipe(
  filter(net => net !== undefined) as OperatorFunction<any, ActiveNetwork>,
  map((net: ActiveNetwork) => {
    if (net === FUJI_NETWORK) {
      throw NETWORK_UNSUPPORTED_ERROR;
    }

    return new ParaSwap(MAINNET_NETWORK.chainId as any, undefined, new Web3());
  }),
);
