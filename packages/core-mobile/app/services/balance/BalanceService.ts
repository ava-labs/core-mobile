import { Network } from '@avalabs/chains-sdk'
import { Account } from 'store/account/types'
import { getAddressByNetwork } from 'store/account/utils'
import { BalanceServiceProvider } from 'services/balance/types'
import { findAsyncSequential } from 'utils/Utils'
import SentryWrapper from 'services/sentry/SentryWrapper'
import { Transaction } from '@sentry/types'
import type {
  NetworkContractToken,
  TokenWithBalance
} from '@avalabs/vm-module-types'
import ModuleManager from 'vmModule/ModuleManager'
import { mapToVmNetwork } from 'vmModule/utils/mapToVmNetwork'
import * as inMemoryCache from 'utils/InMemoryCache'
import BtcBalanceService from './BtcBalanceService'

const balanceProviders: BalanceServiceProvider[] = [BtcBalanceService]

export type BalancesForAccount = {
  accountIndex: number
  chainId: number
  accountAddress: string
  tokens: TokenWithBalance[]
}

export class BalanceService {
  async getBalancesForAccount({
    network,
    account,
    currency,
    sentryTrx,
    customTokens
  }: {
    network: Network
    account: Account
    currency: string
    customTokens?: NetworkContractToken[]
    sentryTrx?: Transaction
  }): Promise<BalancesForAccount> {
    return SentryWrapper.createSpanFor(sentryTrx)
      .setContext('svc.balance.get_for_account')
      .executeAsync(async () => {
        const accountAddress = getAddressByNetwork(account, network)

        if (
          network.vmName === 'EVM' ||
          network.vmName === 'AVM' ||
          network.vmName === 'PVM'
        ) {
          const module = await ModuleManager.loadModuleByNetwork(network)
          const balancesResponse = await module.getBalances({
            customTokens,
            addresses: [accountAddress],
            currency,
            network: mapToVmNetwork(network),
            storage: {
              get: inMemoryCache.getCache,
              set: inMemoryCache.setCache
            }
          })
          const balances = balancesResponse[accountAddress] ?? {}

          return {
            accountIndex: account.index,
            chainId: network.chainId,
            tokens: Object.values(balances),
            accountAddress
          }
        }

        const balanceProvider = await findAsyncSequential(
          balanceProviders,
          value => value.isProviderFor(network)
        )
        if (!balanceProvider) {
          throw new Error(
            `no balance provider found for network ${network.chainId}`
          )
        }

        const tokens = await balanceProvider.getBalances({
          network,
          accountAddress,
          currency,
          sentryTrx,
          customTokens
        })

        return {
          accountIndex: account.index,
          chainId: network.chainId,
          tokens,
          accountAddress
        }
      })
  }

  async getBalancesForAddress({
    network,
    address,
    currency,
    sentryTrx
  }: {
    network: Network
    address: string
    currency: string
    sentryTrx?: Transaction
  }): Promise<TokenWithBalance[]> {
    return SentryWrapper.createSpanFor(sentryTrx)
      .setContext('svc.balance.get_for_address')
      .executeAsync(async () => {
        const balanceProvider = await findAsyncSequential(
          balanceProviders,
          value => value.isProviderFor(network)
        )
        if (!balanceProvider) {
          throw new Error(
            `no balance provider found for network ${network.chainId}`
          )
        }

        return balanceProvider.getBalances({
          network,
          accountAddress: address,
          currency
        })
      })
  }
}

export default new BalanceService()
