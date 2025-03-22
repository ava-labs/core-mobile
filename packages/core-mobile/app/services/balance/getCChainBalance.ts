import { Network } from '@avalabs/core-chains-sdk'
import { TokenType, TokenWithBalanceEVM } from '@avalabs/vm-module-types'
import ModuleManager from 'vmModule/ModuleManager'
import { mapToVmNetwork } from 'vmModule/utils/mapToVmNetwork'
import { coingeckoInMemoryCache } from 'utils/coingeckoInMemoryCache'
import Logger from 'utils/Logger'

const invalidErrorMessage = 'Invalid C-Chain balance'

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
    return Promise.reject('Invalid C-Chain network')
  }

  const module = await ModuleManager.loadModuleByNetwork(cChainNetwork)
  const balancesResponse = await module.getBalances({
    addresses: [cAddress],
    currency,
    network: mapToVmNetwork(cChainNetwork),
    storage: coingeckoInMemoryCache,
    tokenTypes: [TokenType.NATIVE]
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

  if (cChainBalance === undefined) {
    Logger.error('C-Chain balance is undefined')
    return Promise.reject(invalidErrorMessage)
  }

  if ('error' in cChainBalance) {
    Logger.error('C-Chain balance contains error', cChainBalance.error)
    return Promise.reject(invalidErrorMessage)
  }

  if (cChainBalance.type === TokenType.SPL) {
    Logger.error('C-Chain balance cannot be SPL type')
    return Promise.reject(invalidErrorMessage)
  }

  return cChainBalance
}
