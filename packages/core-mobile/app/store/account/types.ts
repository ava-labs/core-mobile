import { CorePrimaryAccount } from '@avalabs/types'

export type AccountCollection = { [accountIndex: number]: CorePrimaryAccount }

export type AccountsState = {
  accounts: AccountCollection
  activeAccountIndex: number
  walletName?: string
}
export type Account = CorePrimaryAccount
