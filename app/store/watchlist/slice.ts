import { createAction, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ChartData } from 'services/token/types'
import { RootState } from 'store'
import { initialState, Charts, MarketToken, Prices, PriceData } from './types'

const reducerName = 'watchlist'

export const defaultChartData = {
  ranges: {
    minDate: 0,
    maxDate: 0,
    minPrice: 0,
    maxPrice: 0,
    diffValue: 0,
    percentChange: 0
  },
  dataPoints: []
}

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

export const selectWatchlistFavoriteIds = (state: RootState) => {
  return state.watchlist.favorites
}

export const selectWatchlistFavorites = (state: RootState) => {
  return state.watchlist.favorites.map(id => state.watchlist.tokens[id])
}

export const selectWatchlistFavoritesIsEmpty = (state: RootState) =>
  state.watchlist.favorites.length === 0

export const selectWatchlistTokens = (state: RootState): MarketToken[] =>
  Object.values(state.watchlist.tokens)

export const selectWatchlistPrices = (state: RootState) =>
  state.watchlist.prices

export const selectWatchlistPrice: (
  coingeckoId: string
) => (state: RootState) => PriceData | undefined =
  (coingeckoId: string) => (state: RootState) =>
    state.watchlist.prices[coingeckoId]

export const selectWatchlistCharts = (state: RootState) =>
  state.watchlist.charts

export const selectWatchlistChart: (
  coingeckoId: string
) => (state: RootState) => ChartData | undefined =
  (coingeckoId: string) => (state: RootState) =>
    state.watchlist.charts[coingeckoId] ?? defaultChartData

// actions
export const {
  toggleFavorite: toggleWatchListFavorite,
  setTokens,
  appendTokens,
  setCharts,
  setPrices
} = watchlistSlice.actions

export const onWatchlistRefresh = createAction(
  `${reducerName}/onWatchlistRefresh`
)

export const watchlistReducer = watchlistSlice.reducer
