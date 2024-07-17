import balanceService from 'services/balance/BalanceService'
import { BITCOIN_NETWORK, BITCOIN_TEST_NETWORK } from '@avalabs/chains-sdk'
import type { TokenWithBalanceBTC } from '@avalabs/vm-module-types'

export async function getBtcBalance(
  isMainnet: boolean,
  address: string,
  currency: string
): Promise<TokenWithBalanceBTC> {
  const token = await balanceService.getBalancesForAddress({
    network: isMainnet ? BITCOIN_NETWORK : BITCOIN_TEST_NETWORK,
    address,
    currency
  })

  if (token.length === 0) {
    return Promise.reject('No balances for address')
  }

  return token[0] as TokenWithBalanceBTC
}
