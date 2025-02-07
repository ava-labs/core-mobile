import { IndexPath } from '../../../../k2-alpine/src/components/Dropdown/SimpleDropdown'

export const initialState = {
  filter: {
    section: 0,
    row: 0
  },
  sort: {
    section: 0,
    row: 0
  }
} as AssetsState

export type AssetsState = {
  filter: IndexPath
  sort: IndexPath
}
