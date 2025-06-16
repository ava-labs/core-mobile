import { CorePrimaryAccount, CoreImportedAccount } from '@avalabs/types'

export type PrimaryAccount = Omit<
  CorePrimaryAccount,
  'active' | 'walletType' | 'walletName'
> & {
  walletId: string
  index: number
}

export type ImportedAccount = Omit<CoreImportedAccount, 'active'> & {
  walletId: string
  index: 0
}

export type Account = PrimaryAccount | ImportedAccount

export type AccountCollection = { [id: string]: Account }

export type AccountsState = {
  accounts: AccountCollection
  activeAccountId: string | null
}
