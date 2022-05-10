import {Big, isMainnetNetwork} from '@avalabs/avalanche-wallet-sdk';
import {
  AppConfig,
  Blockchain,
  fetchTokenBalances,
  getBtcAsset,
  getUTXOs,
  useBridgeConfig,
} from '@avalabs/bridge-sdk';
import {
  useNetworkContext,
  useWalletContext,
} from '@avalabs/wallet-react-components';
import {JsonRpcProvider} from '@ethersproject/providers';
import {getAvalancheProvider} from 'screens/bridge/utils/getAvalancheProvider';

export async function useGetBtcBalances() {
  const network = useNetworkContext()!.network!;
  const wallet = useWalletContext()!.wallet!;
  const bridgeConfig = useBridgeConfig()!.config!;

  const isMainnet = isMainnetNetwork(network.config);
  const btcAddress =
    wallet?.getAddressBTC(isMainnet ? 'bitcoin' : 'testnet') ?? '';

  const avalancheProvider = getAvalancheProvider(network);

  async function loadBalance() {
    return (
      await getBtcBalanceAvalanche(
        bridgeConfig,
        wallet?.getAddressC(),
        avalancheProvider,
      )
    )?.toNumber();
  }

  const {balance: btcBalanceBitcoin, utxos: bitcoinUtxos} = await getUTXOs(
    bridgeConfig,
    btcAddress,
  );

  return {
    bitcoinUtxos,
    btcAddress,
    btcBalanceAvalanche: loadBalance(),
    btcBalanceBitcoin,
  };
}

async function getBtcBalanceAvalanche(
  config: AppConfig,
  address: string,
  provider: JsonRpcProvider,
): Promise<Big | undefined> {
  const btcAsset = getBtcAsset(config);
  if (!btcAsset) {
    return;
  }

  const balanchesBySymbol = await fetchTokenBalances(
    {[btcAsset.symbol]: btcAsset},
    Blockchain.AVALANCHE,
    provider,
    address,
  );

  return balanchesBySymbol?.[btcAsset.symbol];
}
