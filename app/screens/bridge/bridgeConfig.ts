import {BridgeConfig, fetchConfig, NetworkType} from '@avalabs/bridge-sdk';
import {BehaviorSubject, firstValueFrom} from 'rxjs';
import {MAINNET_NETWORK, network$} from '@avalabs/wallet-react-components';

const bridgeConfig$ = new BehaviorSubject<BridgeConfig>({});

export async function getBridgeConfig() {
  const network = await firstValueFrom(network$);
  const networkType =
    network?.chainId === MAINNET_NETWORK.chainId
      ? NetworkType.MAINNET
      : NetworkType.TESTNET;
  const config = await fetchConfig(networkType);

  bridgeConfig$.next(config);

  return config;
}
