import { WalletType } from 'services/wallet/types'
import { Account } from 'store/account'
import { Wallet } from 'store/wallet/types'
import { DropdownGroup } from './components/DropdownMenu'

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

export enum ViewOption {
  Grid = 'Grid view',
  List = 'List view'
}

export enum CollectibleViewOption {
  LargeGrid = 'Large grid',
  CompactGrid = 'Compact grid',
  List = 'List view'
}
