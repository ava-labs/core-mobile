import { WalletType } from 'services/wallet/types'
import { Wallet } from 'store/wallet/types'
import { DropdownGroup } from './components/DropdownMenu'
import { Account } from 'store/account'

export type DropdownSelection = {
  title: string
  data: DropdownGroup[]
  selected: string
  onSelected: (value: string) => void
}

export enum NavigationPresentationMode {
  MODAL = 'modal',
  FORM_SHEET = 'formSheet'
}

export type WalletDisplayData = {
  id: string
  name: string
  type: WalletType
  accounts: Array<AccountDisplayData>
}

export type AccountDisplayData = {
  wallet: Wallet
  account: Account
  isActive: boolean
  hideSeparator: boolean
  onPress: () => void
  onPressDetails: () => void
}
