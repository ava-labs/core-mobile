import { TokenWithBalancePVM } from '@avalabs/vm-module-types'
import Logger from 'utils/Logger'
import { Network } from '@avalabs/core-chains-sdk'
import { Account } from 'store/account'
import { isTokenWithBalancePVM } from '@avalabs/avalanche-module'
import BalanceService from './BalanceService'

export const getPChainBalance = async ({
  account,
  currency,
  avaxXPNetwork
}: {
  account: Account
  currency: string
  avaxXPNetwork: Network
}): Promise<TokenWithBalancePVM> => {
  try {
    const balances = await BalanceService.getBalancesForAccount({
      networks: [avaxXPNetwork],
      account,
      currency
    })

    const pChainBalance = balances
      .flatMap(balance => balance.tokens)
      // TODO: fix type mismatch after fully migrating to the new backend balance types
      // @ts-ignore
      .find(token => isTokenWithBalancePVM(token))

    if (!pChainBalance) {
      Logger.error('Invalid P-Chain balance')
      return Promise.reject('Invalid P-Chain balance')
    }

    return pChainBalance
  } catch (error) {
    Logger.error('Failed to fetch P-Chain balance', error)

    return Promise.reject(`Failed to fetch P-Chain balance`)
  }
}
