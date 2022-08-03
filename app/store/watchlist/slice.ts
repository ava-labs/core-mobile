import { createAction, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'store'
import Logger from 'utils/Logger'
import { initialState, MarketToken } from './types'

const reducerName = 'watchlist'

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
        const newFavorites = state.favorites.filter(id => id !== tokenId)
        state.favorites = newFavorites
      }
    },
    setWatchlistTokens: (state, action: PayloadAction<MarketToken[]>) => {
      state.tokens = action.payload
    }
  }
})

// selectors
export const selectIsWatchlistFavorite =
  (tokenId: string) => (state: RootState) =>
    state.watchlist.favorites.includes(tokenId)

export const selectWatchlistTokenById =
  (tokenId: string) => (state: RootState) => {
    for (const token of state.watchlist.tokens) {
      if (token.id === tokenId) return token
    }
    return undefined
  }

export const selectWatchlistTokens = (state: RootState) =>
  state.watchlist.tokens

export const selectWatchlistFavorites = (state: RootState) =>
  state.watchlist.favorites

// actions
export const { toggleFavorite: toggleWatchListFavorite, setWatchlistTokens } =
  watchlistSlice.actions

export const onWatchlistRefresh = createAction(
  `${reducerName}/onWatchlistRefresh`
)

export const watchlistReducer = watchlistSlice.reducer
