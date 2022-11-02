import { Network } from '@avalabs/chains-sdk'
import { NetworkTokenWithBalance, TokenWithBalanceERC20 } from 'store/balance'
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
export type ChartDays = number

export interface BalanceServiceProvider {
  isProviderFor(network: Network): Promise<boolean>

  getBalances(
    network: Network,
    userAddress: string,
    currency: string,
    sentryTrx?: Transaction
  ): Promise<(NetworkTokenWithBalance | TokenWithBalanceERC20)[]>
}
