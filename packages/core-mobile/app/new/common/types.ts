import { IndexPath } from '@avalabs/k2-alpine'

export enum AmountIndicator {
  Up = 'up',
  Down = 'down',
  Neutral = 'neutral'
}

export type DropdownSelection = {
  title: string
  data: string[][]
  selected: IndexPath
  onSelected: (index: IndexPath) => void
}
