import { TokenWithBalance } from 'store/balance'

export type WatchListState = {
  tokens: TokenWithBalance[]
  favorites: string[]
}
export const initialState: WatchListState = {
  tokens: [],
  favorites: []
}
