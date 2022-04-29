import {
  AppConfig,
  BridgeTransaction,
  trackBridgeTransaction as trackBridgeTransactionSDK,
} from '@avalabs/bridge-sdk';
import {FUJI_NETWORK, MAINNET_NETWORK} from '@avalabs/wallet-react-components';
import {getAvalancheProvider} from 'screens/bridge/utils/getAvalancheProvider';
import {getEthereumProvider} from 'screens/bridge/utils/getEthereumProvider';

export async function trackBridgeTransaction(
  bridgeTransaction: BridgeTransaction,
  config: AppConfig
) {
  const network =
    bridgeTransaction.environment === 'main' ? MAINNET_NETWORK : FUJI_NETWORK;
  const avalancheProvider = getAvalancheProvider(network);
  const ethereumProvider = getEthereumProvider(network);

  const onSave = () => {
    console.log('savedBridge');
  }

  trackBridgeTransactionSDK({
    bridgeTransaction,
    onBridgeTransactionUpdate: onSave,
    config,
    avalancheProvider,
    ethereumProvider,
  });
}
