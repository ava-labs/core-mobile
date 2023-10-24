import { Asset, Blockchain, fetchTokenBalances } from '@avalabs/bridge-sdk'
import { JsonRpcBatchInternal } from '@avalabs/wallets-sdk'
import Big from 'big.js'

export async function getEthereumBalance(
  asset: Asset,
  account: string,
  deprecated: boolean,
  ethereumProvider: JsonRpcBatchInternal
): Promise<Big> {
  const ethereumBalancesBySymbol = await fetchTokenBalances(
    { [asset.symbol]: asset },
    Blockchain.ETHEREUM,
    ethereumProvider,
    account,
    deprecated
  )
  return (
    ethereumBalancesBySymbol[asset.symbol] ??
    Promise.reject('No Eth balance for symbol')
  )
}
