import { IndexPath } from '@avalabs/k2-alpine'

export type DropdownSelection = {
  title: string
  data: string[][]
  selected: IndexPath
  onSelected: (index: IndexPath) => void
}
