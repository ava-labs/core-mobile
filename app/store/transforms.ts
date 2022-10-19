import { createTransform } from 'redux-persist'
import { deserializeBridgeState } from 'contexts/BridgeContext'
import { RawRootState } from 'store'
import { BridgeReducerState } from 'store/bridge/types'
import { WatchListState } from './watchlist'

export const DeserializeBridgeTransform = createTransform<
  BridgeReducerState,
  BridgeReducerState,
  RawRootState,
  RawRootState
>(null, deserializeBridgeState, { whitelist: ['bridge'] })

// a transform for watchlist to blacklist prices and charts
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
      tokens: inboundState.tokens,
      prices: {},
      charts: {}
    }
  },
  // transform state after it gets rehydrated
  (outboundState: WatchListState) => {
    return {
      favorites: outboundState.favorites,
      tokens: outboundState.tokens,
      prices: {},
      charts: {}
    }
  },
  {
    whitelist: ['watchlist']
  }
)
