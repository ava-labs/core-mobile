import { IndexPath } from '@avalabs/k2-alpine'

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
