import { Assets, Blockchain, fetchTokenBalances } from '@avalabs/bridge-sdk'
import { Network } from '@avalabs/chains-sdk'
import Big from 'big.js'
import networkService from 'services/network/NetworkService'

export async function getEthereumBalances(
  assets: Assets,
  account: string,
  deprecated: boolean,
  network: Network
) {
  const provider = networkService.getEthereumProvider(
    network.isTestnet ?? false
  )
  const ethereumBalancesBySymbol = await fetchTokenBalances(
    assets,
    Blockchain.ETHEREUM,
    provider,
    account,
    deprecated
  )

  const balances: Record<string, Big> = {}

  for (const symbol in assets) {
    balances[symbol] = ethereumBalancesBySymbol?.[symbol]
  }

  return Object.entries(assets).map(([symbol, asset]) => {
    const balanceStr = ethereumBalancesBySymbol?.[symbol]
    const balance = balanceStr ? new Big(balanceStr) : undefined

    return { symbol, asset, balance }
  })
}
