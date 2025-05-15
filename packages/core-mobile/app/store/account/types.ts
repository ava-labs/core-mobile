import { CorePrimaryAccount, CoreImportedAccount } from '@avalabs/types'

export type PrimaryAccount = CorePrimaryAccount & {
  walletId: string
  index: number
}

export type ImportedAccount = CoreImportedAccount & {
  walletId: string
}

export type Account = PrimaryAccount | ImportedAccount

export type AccountCollection = { [id: string]: Account }

export type AccountsState = {
  accounts: AccountCollection
  activeAccountId: string | null
}
