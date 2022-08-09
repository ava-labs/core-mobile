import { createAction, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'store'
import { initialState, MarketToken } from './types'

const reducerName = 'watchlist'

export const watchlistSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    toggleFavorite: (state, action: PayloadAction<MarketToken>) => {
      const token = action.payload
      if (!state.favorites.includes(token)) {
        // set favorite
        state.favorites.push(token)
      } else {
        // unset favorite
        const newFavorites = state.favorites.filter(tk => tk.id !== token.id)
        state.favorites = newFavorites
      }
    },
    appendWatchlist: (state, action: PayloadAction<MarketToken[]>) => {
      const newTokens: MarketToken[] = []
      for (const newToken of action.payload) {
        let token: MarketToken | undefined
        for (const existingToken of state.tokens) {
          if (newToken.id === existingToken.id) {
            token = existingToken
          }
        }
        if (!token) {
          newTokens.push(newToken)
        }
      }
      state.tokens = [...state.tokens, ...newTokens]
    },
    setWatchlistTokens: (state, action: PayloadAction<MarketToken[]>) => {
      state.tokens = action.payload
    }
  }
})

// selectors
export const selectIsWatchlistFavorite =
  (tokenId: string) => (state: RootState) =>
    state.watchlist.favorites.find(tk => tk.id === tokenId) !== undefined

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
export const {
  toggleFavorite: toggleWatchListFavorite,
  setWatchlistTokens,
  appendWatchlist
} = watchlistSlice.actions

export const onWatchlistRefresh = createAction(
  `${reducerName}/onWatchlistRefresh`
)

export const onAppendToWatchlist = createAction(
  `${reducerName}/onAppendToWatchlist`
)

export const watchlistReducer = watchlistSlice.reducer
