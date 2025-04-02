import { createAction, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'store'
import {
  AVAX_COINGECKO_ID,
  BITCOIN_COINGECKO_ID,
  ETHEREUM_COINGECKO_ID
} from 'consts/coingecko'
import { initialState } from './types'

const DEFAULT_WATCHLIST_FAVORITES = [
  ETHEREUM_COINGECKO_ID,
  BITCOIN_COINGECKO_ID,
  AVAX_COINGECKO_ID
]

export const reducerName = 'watchlist'

export const watchlistSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    toggleFavorite: (state, action: PayloadAction<string>) => {
      const tokenId = action.payload

      if (!state.favorites.includes(tokenId)) {
        // set favorite
        state.favorites.push(tokenId)
      } else {
        // unset favorite
        state.favorites = state.favorites.filter(id => id !== tokenId)
      }
    },
    addDefaultWatchlistFavorites: state => {
      DEFAULT_WATCHLIST_FAVORITES.forEach(tokenId => {
        if (!state.favorites.includes(tokenId)) {
          state.favorites = [tokenId, ...state.favorites]
        }
      })
    },
    reorderFavorites: (state, action: PayloadAction<string[]>) => {
      state.favorites = action.payload
    }
  }
})

// selectors
export const selectIsWatchlistFavorite =
  (coingeckoId: string) => (state: RootState) =>
    state.watchlist.favorites.includes(coingeckoId)

export const selectWatchlistFavoriteIds = (state: RootState): string[] => {
  return state.watchlist.favorites
}

export const selectWatchlistFavoritesIsEmpty = (state: RootState): boolean =>
  state.watchlist.favorites.length === 0

// actions
export const {
  toggleFavorite: toggleWatchListFavorite,
  reorderFavorites,
  addDefaultWatchlistFavorites
} = watchlistSlice.actions

export const fetchWatchlist = createAction(`${reducerName}/fetchWatchlist`)

export const watchlistReducer = watchlistSlice.reducer
