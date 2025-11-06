import {
  CorePrimaryAccount,
  CoreImportedAccount,
  CoreAccountType
} from '@avalabs/types'
import { NetworkVMType } from '@avalabs/vm-module-types'

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

export type PlatformAccounts = {
  chainId: number
  name: string
  networkVmType: NetworkVMType.AVM | NetworkVMType.PVM
  type: CoreAccountType
  addresses: string[]
}[]
