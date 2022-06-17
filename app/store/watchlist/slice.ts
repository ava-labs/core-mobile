import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'store'
import { initialState } from './types'

const reducerName = 'watchlist'

export const watchlistSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    toggleFavorite: (state, action: PayloadAction<string>) => {
      console.log(action.payload)
      const tokenId = action.payload
      if (!state.favorites.includes(tokenId)) {
        // set favorite
        state.favorites.push(tokenId)
      } else {
        // unset favorite
        const newFavorites = state.favorites.filter(id => id !== tokenId)
        state.favorites = newFavorites
      }
    }
  }
})

// selectors
export const selectIsWatchlistFavorite =
  (tokenId: string) => (state: RootState) =>
    state.watchlist.favorites.includes(tokenId)

export const selectWatchlistFavorites = (state: RootState) =>
  state.watchlist.favorites

// actions
export const { toggleFavorite: toggleWatchListFavorite } =
  watchlistSlice.actions

export const watchlistReducer = watchlistSlice.reducer
