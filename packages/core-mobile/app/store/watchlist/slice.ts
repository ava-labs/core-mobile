import { createAction, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ChartData } from 'services/token/types'
import { RootState } from 'store'
import {
  initialState,
  Charts,
  MarketToken,
  Prices,
  PriceData,
  defaultChartData
} from './types'

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
    },
    setTokens: (
      state,
      action: PayloadAction<{ [coingeckoID: string]: MarketToken }>
    ) => {
      state.tokens = action.payload
    },
    appendTokens: (state, action: PayloadAction<MarketToken[]>) => {
      for (const token of action.payload) {
        if (!state.tokens[token.id]) {
          state.tokens[token.id] = token
        }
      }
    },
    setCharts: (state, action: PayloadAction<Charts>) => {
      state.charts = {
        ...state.charts,
        ...action.payload
      }
    },
    setPrices: (state, action: PayloadAction<Prices>) => {
      state.prices = {
        ...state.prices,
        ...action.payload
      }
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

export const selectWatchlistFavorites = (state: RootState): MarketToken[] => {
  return state.watchlist.favorites.reduce((acc, id) => {
    const token = state.watchlist.tokens[id]
    if (token) {
      acc.push(token)
    }
    return acc
  }, [] as MarketToken[])
}

export const selectWatchlistFavoritesIsEmpty = (state: RootState): boolean =>
  state.watchlist.favorites.length === 0

export const selectWatchlistTokens = (state: RootState): MarketToken[] =>
  Object.values(state.watchlist.tokens)

export const selectWatchlistPrices = (state: RootState): Prices =>
  state.watchlist.prices

export const selectWatchlistPrice: (
  coingeckoId: string
) => (state: RootState) => PriceData | undefined =
  (coingeckoId: string) => (state: RootState) =>
    state.watchlist.prices[coingeckoId]

export const selectWatchlistCharts = (state: RootState): Charts =>
  state.watchlist.charts

export const selectWatchlistChart: (
  coingeckoId: string
) => (state: RootState) => ChartData | undefined =
  (coingeckoId: string) => (state: RootState) =>
    state.watchlist.charts[coingeckoId] ?? defaultChartData

// actions
export const {
  toggleFavorite: toggleWatchListFavorite,
  reorderFavorites,
  setTokens,
  appendTokens,
  setCharts,
  setPrices
} = watchlistSlice.actions

export const fetchWatchlist = createAction(`${reducerName}/fetchWatchlist`)

export const onWatchlistRefresh = createAction(
  `${reducerName}/onWatchlistRefresh`
)

export const watchlistReducer = watchlistSlice.reducer
