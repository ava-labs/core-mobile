import { BITCOIN_NETWORK, BITCOIN_TEST_NETWORK } from '@avalabs/chains-sdk'
import type { TokenWithBalanceBTC } from '@avalabs/vm-module-types'
import ModuleManager from 'vmModule/ModuleManager'
import { mapToVmNetwork } from 'vmModule/utils/mapToVmNetwork'

export async function getBtcBalance(
  isMainnet: boolean,
  address: string,
  currency: string
): Promise<TokenWithBalanceBTC> {
  const network = isMainnet ? BITCOIN_NETWORK : BITCOIN_TEST_NETWORK
  const balancesResponse = await ModuleManager.bitcoinModule.getBalances({
    addresses: [address],
    currency,
    network: mapToVmNetwork(network)
  })
  const balances = Object.values(balancesResponse[address] ?? [])
  if (balances[0] === undefined) {
    return Promise.reject('No balances for address')
  }
  return balances[0]
}
