import { createTransform } from 'redux-persist'
import { RawRootState } from 'store'
import { WatchListState, reducerName } from 'store/watchlist'

// a transform for watchlist to blacklist tokens, prices and charts
export const WatchlistBlacklistTransform = createTransform<
  WatchListState,
  WatchListState,
  RawRootState,
  RawRootState
>(
  // transform state before it gets serialized and persisted
  (inboundState: WatchListState) => {
    return {
      favorites: inboundState.favorites,
      tokens: {},
      prices: {},
      charts: {}
    }
  },
  // transform state after it gets rehydrated
  (outboundState: WatchListState) => {
    return {
      favorites: outboundState.favorites,
      tokens: {},
      prices: {},
      charts: {}
    }
  },
  {
    whitelist: [reducerName]
  }
)
