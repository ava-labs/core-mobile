import { Account } from 'store/account'

export type GetAccountDataProps = {
  hideSeparator: boolean
  isActive: boolean
  account: Account
  walletName?: string
}

export type GetXpAccountDataProps = {
  hideSeparator: boolean
  isActive: boolean
  accountId: string
  numberOfAddresses: number
}
