import { IndexPath } from '@avalabs/k2-alpine'
import { WalletType } from 'services/wallet/types'

export type DropdownSelection = {
  title: string
  data: string[][]
  selected: IndexPath
  onSelected: (index: IndexPath) => void
  onDeselect?: (index: IndexPath) => void
  useAnchorRect?: boolean
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