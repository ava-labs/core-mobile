import { WalletType } from 'services/wallet/types'
import { DropdownGroup } from './components/DropdownMenu'

export type DropdownSelection = {
  title: string
  data: DropdownGroup[]
  selected: string
  onSelected: (value: string) => void
  onDeselect?: (value: string) => void
  scrollContentMaxHeight?: number
}

export enum NavigationPresentationMode {
  MODAL = 'modal',
  FORM_SHEET = 'formSheet'
}

export type WalletDisplayData = {
  id: string
  name: string
  type: WalletType
  accounts: Array<{
    hideSeparator: boolean
    containerSx: {
      backgroundColor: string
      borderRadius: number
    }
    title: React.JSX.Element
    subtitle: React.JSX.Element
    leftIcon: React.JSX.Element
    value: React.JSX.Element
    onPress: () => void
    accessory: React.JSX.Element
  }>
}
