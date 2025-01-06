import { Network } from '@avalabs/core-chains-sdk'
import { Account } from 'store/account/types'
import { getAddressByNetwork } from 'store/account/utils'
import SentryWrapper from 'services/sentry/SentryWrapper'
import {
  type NetworkContractToken,
  type TokenWithBalance,
  type Error,
  TokenType
} from '@avalabs/vm-module-types'
import ModuleManager from 'vmModule/ModuleManager'
import { mapToVmNetwork } from 'vmModule/utils/mapToVmNetwork'
import { coingeckoInMemoryCache } from 'utils/coingeckoInMemoryCache'
import { SpanName } from 'services/sentry/types'

export type BalancesForAccount = {
  accountIndex: number
  chainId: number
  accountAddress: string
  tokens: (TokenWithBalance | Error)[]
}

export class BalanceService {
  async getBalancesForAccount({
    network,
    account,
    currency,
    sentrySpanName,
    customTokens
  }: {
    network: Network
    account: Account
    currency: string
    customTokens?: NetworkContractToken[]
    sentrySpanName?: SpanName
  }): Promise<BalancesForAccount> {
    return SentryWrapper.startSpan(
      { name: sentrySpanName, contextName: 'svc.balance.get_for_account' },
      async () => {
        const accountAddress = getAddressByNetwork(account, network)

        const module = await ModuleManager.loadModuleByNetwork(network)
        const balancesResponse = await module.getBalances({
          customTokens,
          addresses: [accountAddress],
          currency,
          network: mapToVmNetwork(network),
          storage: coingeckoInMemoryCache,
          tokenTypes: [TokenType.NATIVE, TokenType.ERC20]
        })

        const balances = balancesResponse[accountAddress] ?? {}
        if ('error' in balances) {
          return {
            accountIndex: account.index,
            chainId: network.chainId,
            tokens: [],
            accountAddress
          }
        }

        return {
          accountIndex: account.index,
          chainId: network.chainId,
          tokens: Object.values(balances),
          accountAddress
        }
      }
    )
  }
}

export default new BalanceService()
