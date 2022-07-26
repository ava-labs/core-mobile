import {
  AppConfig,
  Blockchain,
  fetchTokenBalances,
  getBtcAsset
} from '@avalabs/bridge-sdk'
import { JsonRpcProvider } from '@ethersproject/providers'
import Big from 'big.js'
import balanceService from 'services/balance/BalanceService'
import { BITCOIN_NETWORK, BITCOIN_TEST_NETWORK } from '@avalabs/chains-sdk'
import { TokenWithBalance } from 'store/balance'

export async function getBtcBalance(
  isMainnet: boolean,
  address: string,
  currency: string
): Promise<TokenWithBalance> {
  const token = await balanceService.getBalancesForAddress(
    isMainnet ? BITCOIN_NETWORK : BITCOIN_TEST_NETWORK,
    address,
    currency
  )

  return token[0]
}

export async function getAvalancheBtcBalance(
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
