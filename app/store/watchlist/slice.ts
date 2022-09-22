import { createAction, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'store'
import { initialState, MarketToken, WatchListState } from './types'

const reducerName = 'watchlist'

export const watchlistSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    toggleFavorite: (state, action: PayloadAction<MarketToken>) => {
      const token = action.payload
      if (!state.favorites.some(tk => tk.id === token.id)) {
        // set favorite
        state.favorites.push(token)
      } else {
        // unset favorite
        state.favorites = state.favorites.filter(tk => tk.id !== token.id)
      }
    },
    appendWatchlist: (state, action: PayloadAction<MarketToken[]>) => {
      const newTokens: MarketToken[] = []
      for (const newToken of action.payload) {
        const exists = state.tokens.some(tk => tk.id === newToken.id)
        if (!exists) {
          newTokens.push(newToken)
        }
      }
      setTokens(state, [...state.tokens, ...newTokens])
    },
    setWatchlistTokens: (state, action: PayloadAction<MarketToken[]>) => {
      setTokens(state, action.payload)
    }
  }
})

/**
 * Set tokens and update favorites.
 * @private
 */
function setTokens(state: WatchListState, tokens: MarketToken[]): void {
  state.tokens = tokens
  state.favorites = state.favorites.map(
    favorite => tokens.find(t => t.id === favorite.id) || favorite
  )
}

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

export const selectWatchlistFavoritesIsEmpty = (state: RootState) =>
  state.watchlist.favorites.length === 0

// actions
export const {
  toggleFavorite: toggleWatchListFavorite,
  setWatchlistTokens,
  appendWatchlist
} = watchlistSlice.actions

export const onWatchlistRefresh = createAction(
  `${reducerName}/onWatchlistRefresh`
)

export const watchlistReducer = watchlistSlice.reducer
