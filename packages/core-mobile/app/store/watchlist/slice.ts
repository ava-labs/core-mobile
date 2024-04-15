import { createAction, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'store'
import { initialState } from './types'

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
export const { toggleFavorite: toggleWatchListFavorite, reorderFavorites } =
  watchlistSlice.actions

export const fetchWatchlist = createAction(`${reducerName}/fetchWatchlist`)

export const onWatchlistRefresh = createAction(
  `${reducerName}/onWatchlistRefresh`
)

export const watchlistReducer = watchlistSlice.reducer
