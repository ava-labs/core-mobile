export type AccountCollection = { [accountIndex: number]: Account }

export type AccountsState = {
  accounts: AccountCollection
  activeAccountIndex: number
}

export type Account = {
  index: number
  title: string
  addressBtc: string
  address: string //TODO: rename to addressC (c-chain address)
  addressAVM?: string
  addressPVM?: string
  addressCoreEth?: string
}
