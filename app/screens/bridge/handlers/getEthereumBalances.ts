import { Assets, Blockchain, fetchTokenBalances } from '@avalabs/bridge-sdk'
import { JsonRpcBatchInternal } from '@avalabs/wallets-sdk'
import Big from 'big.js'

export async function getEthereumBalances(
  assets: Assets,
  account: string,
  deprecated: boolean,
  ethereumProvider: JsonRpcBatchInternal
) {
  const ethereumBalancesBySymbol = await fetchTokenBalances(
    assets,
    Blockchain.ETHEREUM,
    ethereumProvider,
    account,
    deprecated
  )

  return Object.entries(assets).map(([symbol, asset]) => {
    const balanceStr = ethereumBalancesBySymbol?.[symbol]
    const balance = balanceStr ? new Big(balanceStr) : undefined

    return { symbol, asset, balance }
  })
}
