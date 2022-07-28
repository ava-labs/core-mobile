import { Asset, Blockchain, fetchTokenBalances } from '@avalabs/bridge-sdk'
import { JsonRpcBatchInternal } from '@avalabs/wallets-sdk'
import Big from 'big.js'

export async function getEthereumBalance(
  asset: Asset,
  account: string,
  deprecated: boolean,
  ethereumProvider: JsonRpcBatchInternal
) {
  const ethereumBalancesBySymbol = await fetchTokenBalances(
    { [asset.symbol]: asset },
    Blockchain.ETHEREUM,
    ethereumProvider,
    account,
    deprecated
  )

  const balance: Big = ethereumBalancesBySymbol?.[asset.symbol]

  return balance
}
