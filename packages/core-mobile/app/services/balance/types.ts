import { Network } from '@avalabs/chains-sdk'
import { PTokenWithBalance, XTokenWithBalance } from 'store/balance/types'
import { Transaction } from '@sentry/types'
import {
  NetworkTokenWithBalance,
  TokenWithBalanceERC20
} from '@avalabs/vm-module-types'

export type TokenAddress = string

export type GetBalancesParams = {
  network: Network
  accountAddress: string
  currency: string
  sentryTrx?: Transaction
}

export interface BalanceServiceProvider {
  isProviderFor(network: Network): Promise<boolean>

  getBalances({
    network,
    accountAddress,
    currency,
    sentryTrx
  }: GetBalancesParams): Promise<
    (
      | NetworkTokenWithBalance
      | TokenWithBalanceERC20
      | PTokenWithBalance
      | XTokenWithBalance
    )[]
  >
}
