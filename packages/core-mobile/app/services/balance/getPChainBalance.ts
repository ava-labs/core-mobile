import ModuleManager from 'vmModule/ModuleManager'
import { mapToVmNetwork } from 'vmModule/utils/mapToVmNetwork'
import { TokenWithBalancePVM } from '@avalabs/vm-module-types'
import { isTokenWithBalancePVM } from '@avalabs/avalanche-module'
import Logger from 'utils/Logger'
import { Network } from '@avalabs/core-chains-sdk'

export const getPChainBalance = async ({
  pAddress,
  currency,
  avaxXPNetwork
}: {
  pAddress: string
  currency: string
  avaxXPNetwork: Network
}): Promise<TokenWithBalancePVM> => {
  const balancesResponse = await ModuleManager.avalancheModule.getBalances({
    addresses: [pAddress],
    currency,
    network: mapToVmNetwork(avaxXPNetwork)
  })

  const pChainBalanceResponse = balancesResponse[pAddress]
  if (!pChainBalanceResponse || 'error' in pChainBalanceResponse) {
    Logger.error(
      'Failed to fetch P-Chain balance',
      pChainBalanceResponse?.error
    )

    return Promise.reject(`Failed to fetch P-Chain balance`)
  }
  const pChainBalance = pChainBalanceResponse[avaxXPNetwork.networkToken.symbol]

  if (
    pChainBalance === undefined ||
    'error' in pChainBalance ||
    !isTokenWithBalancePVM(pChainBalance)
  ) {
    Logger.error('Invalid P-Chain balance')
    return Promise.reject('Invalid P-Chain balance')
  }
  return pChainBalance
}
