import { IndexPath } from '@avalabs/k2-alpine'

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
