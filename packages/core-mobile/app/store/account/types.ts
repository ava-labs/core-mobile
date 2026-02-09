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
  'active' | 'walletType' | 'walletName' | 'xpAddresses'
> & {
  walletId: string
  index: number
}

export type ImportedAccount = Omit<
  CoreImportedAccount,
  'active' | 'xpAddresses'
> & {
  walletId: string
  index: 0
}

export type Account = PrimaryAccount | ImportedAccount

export type AccountCollection = { [id: string]: Account }

export type LedgerAddresses = {
  id: string
  walletId: string
  index: number
  mainnet: {
    addressBTC: string
    addressAVM: string
    addressPVM: string
    addressCoreEth: string
  }
  testnet: {
    addressBTC: string
    addressAVM: string
    addressPVM: string
    addressCoreEth: string
  }
}

export type LedgerAddressesCollection = {
  [accountId: string]: LedgerAddresses
}

export type AccountsState = {
  accounts: AccountCollection
  activeAccountId: string | null
  // For managing ledger mainnet/testnet accounts separately
  // we derive mainnet and testnet addresses at the same time
  // to avoid requiring users to open app on ledger to derive mainnet/testnet addresses
  ledgerAddresses: LedgerAddressesCollection
}
