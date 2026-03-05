import { createAction, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'store/types'
import { TOKEN_IDS } from 'consts/tokenIds'
import { initialState, InternalId } from './types'

const DEFAULT_WATCHLIST_FAVORITES = [
  TOKEN_IDS.ETH,
  TOKEN_IDS.BTC,
  TOKEN_IDS.AVAX
]

export const reducerName = 'watchlist'

export const watchlistSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    toggleWatchListFavorite: (state, action: PayloadAction<InternalId>) => {
      const index = state.favorites.findIndex(
        tokenId => tokenId === action.payload
      )
      if (index !== -1) {
        state.favorites.splice(index, 1)
      } else {
        state.favorites.push(action.payload)
      }
    },
    addDefaultWatchlistFavorites: state => {
      DEFAULT_WATCHLIST_FAVORITES.forEach(tokenId => {
        if (!state.favorites.includes(tokenId)) {
          state.favorites = [tokenId, ...state.favorites]
        }
      })
    }
  }
})

// selectors
export const selectIsWatchlistFavorite =
  (internalId: InternalId) => (state: RootState) =>
    state.watchlist.favorites.includes(internalId)

export const selectWatchlistFavoriteIds = (state: RootState): InternalId[] =>
  state.watchlist.favorites

export const { toggleWatchListFavorite, addDefaultWatchlistFavorites } =
  watchlistSlice.actions

export const fetchWatchlist = createAction(`${reducerName}/fetchWatchlist`)

export const watchlistReducer = watchlistSlice.reducer
