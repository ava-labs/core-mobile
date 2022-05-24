import { Asset, Blockchain, fetchTokenBalances } from '@avalabs/bridge-sdk'
import Big from 'big.js'
import { Network } from 'store/network'
import { getEthereumProvider } from '../utils/getEthereumProvider'

export async function getEthereumBalance(
  asset: Asset,
  account: string,
  deprecated: boolean,
  network: Network
) {
  const provider = getEthereumProvider(network)
  const ethereumBalancesBySymbol = await fetchTokenBalances(
    { [asset.symbol]: asset },
    Blockchain.ETHEREUM,
    provider,
    account,
    deprecated
  )

  const balance: Big = ethereumBalancesBySymbol?.[asset.symbol]

  return balance
}
