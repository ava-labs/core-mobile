import { Network } from '@avalabs/core-chains-sdk'
import { Transaction } from '@sentry/types'
import {
  NetworkContractToken,
  TokenWithBalance
} from '@avalabs/vm-module-types'

export type TokenAddress = string

export type GetBalancesParams = {
  network: Network
  accountAddress: string
  currency: string
  customTokens?: NetworkContractToken[]
  sentryTrx?: Transaction
}

export interface BalanceServiceProvider {
  isProviderFor(network: Network): Promise<boolean>

  getBalances({
    network,
    accountAddress,
    currency,
    sentryTrx,
    customTokens
  }: GetBalancesParams): Promise<TokenWithBalance[]>
}
