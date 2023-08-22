import {
  AppConfig,
  Blockchain,
  fetchTokenBalances,
  getBtcAsset
} from '@avalabs/bridge-sdk'
import { JsonRpcProvider } from 'ethers'
import Big from 'big.js'
import balanceService from 'services/balance/BalanceService'
import { BITCOIN_NETWORK, BITCOIN_TEST_NETWORK } from '@avalabs/chains-sdk'
import { NetworkTokenWithBalance, TokenWithBalanceERC20 } from 'store/balance'

export async function getBtcBalance(
  isMainnet: boolean,
  address: string,
  currency: string
): Promise<NetworkTokenWithBalance | TokenWithBalanceERC20> {
  const token = await balanceService.getBalancesForAddress(
    isMainnet ? BITCOIN_NETWORK : BITCOIN_TEST_NETWORK,
    address,
    currency
  )

  if (token.length === 0) {
    return Promise.reject('No balances for address')
  }

  return token[0] as NetworkTokenWithBalance | TokenWithBalanceERC20
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
