import { Network } from '@avalabs/core-chains-sdk'
import { TokenType, TokenWithBalanceEVM } from '@avalabs/vm-module-types'
import ModuleManager from 'vmModule/ModuleManager'
import { mapToVmNetwork } from 'vmModule/utils/mapToVmNetwork'
import { coingeckoInMemoryCache } from 'utils/coingeckoInMemoryCache'
import Logger from 'utils/Logger'

const TOKEN_TYPES = [TokenType.NATIVE]

export const getCChainBalance = async ({
  cChainNetwork,
  cAddress,
  currency
}: {
  cChainNetwork: Network | undefined
  cAddress: string
  currency: string
}): Promise<TokenWithBalanceEVM | undefined> => {
  if (cChainNetwork === undefined) {
    return Promise.reject('invalid C-Chain network')
  }

  const module = await ModuleManager.loadModuleByNetwork(cChainNetwork)
  const balancesResponse = await module.getBalances({
    addresses: [cAddress],
    currency,
    network: mapToVmNetwork(cChainNetwork),
    storage: coingeckoInMemoryCache,
    tokenTypes: TOKEN_TYPES
  })

  const cChainBalanceResponse = balancesResponse[cAddress]

  if (!cChainBalanceResponse || 'error' in cChainBalanceResponse) {
    Logger.error(
      'Failed to fetch C-Chain balance',
      cChainBalanceResponse?.error
    )

    return Promise.reject(`Failed to fetch C-Chain balance`)
  }

  const cChainBalance = cChainBalanceResponse[cChainNetwork.networkToken.symbol]

  if (cChainBalance === undefined || 'error' in cChainBalance) {
    Logger.error('Invalid C-Chain balance', cChainBalance?.error)
    return Promise.reject('Invalid C-Chain balance')
  }

  return cChainBalance
}
