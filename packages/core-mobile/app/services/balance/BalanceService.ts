import { PTokenWithBalance, XTokenWithBalance } from 'store/balance/types'
import { Network } from '@avalabs/chains-sdk'
import { Account } from 'store/account/types'
import { getAddressByNetwork } from 'store/account/utils'
import GlacierBalanceProvider from 'services/balance/GlacierBalanceService'
import { BalanceServiceProvider } from 'services/balance/types'
import { findAsyncSequential } from 'utils/Utils'
import SentryWrapper from 'services/sentry/SentryWrapper'
import { Transaction } from '@sentry/types'
import type {
  NetworkContractToken,
  NetworkTokenWithBalance,
  TokenWithBalanceERC20
} from '@avalabs/vm-module-types'
import ModuleManager from 'vmModule/ModuleManager'
import BtcBalanceService from './BtcBalanceService'

const balanceProviders: BalanceServiceProvider[] = [
  GlacierBalanceProvider,
  BtcBalanceService
]

export type BalancesForAccount = {
  accountIndex: number
  chainId: number
  accountAddress: string
  tokens: (
    | NetworkTokenWithBalance
    | TokenWithBalanceERC20
    | PTokenWithBalance
    | XTokenWithBalance
  )[]
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

        if (network.vmName === 'EVM') {
          const module = await ModuleManager.loadModuleByNetwork(network)
          const balancesResponse = await SentryWrapper.createSpanFor(sentryTrx)
            .setContext('svc.balance.get')
            .executeAsync(async () => {
              return await module.getBalances({
                customTokens,
                addresses: [accountAddress],
                currency,
                network
              })
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
  }): Promise<
    (
      | NetworkTokenWithBalance
      | TokenWithBalanceERC20
      | PTokenWithBalance
      | XTokenWithBalance
    )[]
  > {
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
