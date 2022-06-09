import { Big } from '@avalabs/avalanche-wallet-sdk'
import {
  AppConfig,
  Blockchain,
  fetchTokenBalances,
  getBtcAsset
} from '@avalabs/bridge-sdk'
import { JsonRpcProvider } from '@ethersproject/providers'

export async function getBtcBalance(
  bridgeConfig: AppConfig,
  btcAddress: string,
  avalancheAddress: string,
  avalancheProvider: JsonRpcProvider
) {
  // const network = useNetworkContext()!.network!;
  // const wallet = useWalletContext()!.wallet!;
  // const bridgeConfig = useBridgeConfig()!.config!;

  async function loadBalance() {
    return (
      await getBtcBalanceAvalanche(
        bridgeConfig,
        avalancheAddress,
        avalancheProvider
      )
    )?.toNumber()
  }

  //fixme - bridge-sdk doesnt have getUTXOs
  // const { balance: btcBalanceBitcoin, utxos: bitcoinUtxos } = await getUTXOs(
  //   bridgeConfig,
  //   btcAddress
  // )

  return {
    bitcoinUtxos: [], //fixme
    btcBalanceAvalanche: await loadBalance(),
    btcBalanceBitcoin: 0 //fixme
  }
}

async function getBtcBalanceAvalanche(
  config: AppConfig,
  address: string,
  provider: JsonRpcProvider
): Promise<Big | undefined> {
  const btcAsset = getBtcAsset(config)
  if (!btcAsset) {
    return
  }

  const balanchesBySymbol = await fetchTokenBalances(
    { [btcAsset.symbol]: btcAsset },
    Blockchain.AVALANCHE,
    provider,
    address
  )

  return balanchesBySymbol?.[btcAsset.symbol]
}
