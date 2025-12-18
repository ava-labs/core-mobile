import { CorePrimaryAccount, CoreImportedAccount } from '@avalabs/types'

export type XPAddressDictionary = {
  [address: string]: {
    space: 'e' | 'i'
    index: number
    hasActivity: boolean
  }
}

export type PrimaryAccount = Omit<
  CorePrimaryAccount,
  'active' | 'walletType' | 'walletName'
> & {
  walletId: string
  index: number
  xpAddressDictionary: XPAddressDictionary
}

export type ImportedAccount = Omit<CoreImportedAccount, 'active'> & {
  walletId: string
  index: 0
  xpAddressDictionary: XPAddressDictionary
}

export type Account = PrimaryAccount | ImportedAccount

export type AccountCollection = { [id: string]: Account }

export type AccountsState = {
  accounts: AccountCollection
  activeAccountId: string | null
}
