import { Account } from 'dto/Account'

export type AccountCollection = { [accountIndex: number]: Account }

export type AccountsState = {
  accounts: AccountCollection
  activeAccountIndex: number
}
