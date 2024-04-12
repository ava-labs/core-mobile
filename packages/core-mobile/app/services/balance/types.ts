import { Network } from '@avalabs/chains-sdk'
import {
  NetworkTokenWithBalance,
  TokenWithBalanceERC20,
  XPTokenWithBalance
} from 'store/balance'
import { Transaction } from '@sentry/types'

export type TokenListDict = {
  [contract: string]: TokenListERC20
}

export type TokenListERC20 = {
  address: string
  chainId: number
  name: string
  symbol: string
  decimals: number
  logoURI?: string
}

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
    (NetworkTokenWithBalance | TokenWithBalanceERC20 | XPTokenWithBalance)[]
  >
}
