import balanceService from 'services/balance/BalanceService'
import { BITCOIN_NETWORK, BITCOIN_TEST_NETWORK } from '@avalabs/chains-sdk'
import type {
  NetworkTokenWithBalance,
  TokenWithBalanceERC20
} from '@avalabs/vm-module-types'

export async function getBtcBalance(
  isMainnet: boolean,
  address: string,
  currency: string
): Promise<NetworkTokenWithBalance | TokenWithBalanceERC20> {
  const token = await balanceService.getBalancesForAddress({
    network: isMainnet ? BITCOIN_NETWORK : BITCOIN_TEST_NETWORK,
    address,
    currency
  })

  if (token.length === 0) {
    return Promise.reject('No balances for address')
  }

  return token[0] as NetworkTokenWithBalance | TokenWithBalanceERC20
}
