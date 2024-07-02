import { Network, NetworkVMType } from '@avalabs/chains-sdk'
import {
  NetworkTokenWithBalance,
  TokenWithBalanceERC20
} from '@avalabs/vm-module-types'
import {
  BalanceServiceProvider,
  GetBalancesParams
} from 'services/balance/types'
import SentryWrapper from 'services/sentry/SentryWrapper'
import ModuleManager from 'vmModule/ModuleManager'

export class EvmBalanceService implements BalanceServiceProvider {
  async isProviderFor(network: Network): Promise<boolean> {
    return network.vmName === NetworkVMType.EVM
  }

  async getBalances({
    network,
    accountAddress,
    currency,
    sentryTrx,
    customTokens
  }: GetBalancesParams): Promise<
    (NetworkTokenWithBalance | TokenWithBalanceERC20)[]
  > {
    return SentryWrapper.createSpanFor(sentryTrx)
      .setContext('svc.balance.evm.get')
      .executeAsync(async () => {
        const caip2ChainId = ModuleManager.convertChainIdToCaip2(network)
        const module = await ModuleManager.loadModuleByNetwork(network)
        const balancesResponse = await module.getBalances({
          customTokens,
          addresses: [accountAddress],
          currency,
          chainId: caip2ChainId
        })
        const balances = balancesResponse[accountAddress] ?? {}
        return Object.values(balances)
      })
  }
}

export default new EvmBalanceService()
