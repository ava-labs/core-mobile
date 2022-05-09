import { ActiveNetwork } from '@avalabs/wallet-react-components'
import { Assets, Blockchain, fetchTokenBalances } from '@avalabs/bridge-sdk'
import Big from 'big.js'
import { getEthereumProvider } from '../utils/getEthereumProvider'

export async function getEthereumBalances(
  assets: Assets,
  account: string,
  deprecated: boolean,
  network?: ActiveNetwork
) {
  const provider = getEthereumProvider(network)
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
