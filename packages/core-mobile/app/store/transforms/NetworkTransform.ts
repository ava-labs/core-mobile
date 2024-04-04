import { createTransform } from 'redux-persist'
import { RawRootState } from 'store'
import { NetworkState, reducerName } from 'store/network'

// a transform for network to blacklist networks
export const NetworkTransform = createTransform<
  NetworkState,
  NetworkState,
  RawRootState,
  RawRootState
>(
  // transform state before it gets serialized and persisted
  (inboundState: NetworkState) => {
    return {
      networks: {},
      customNetworks: inboundState.customNetworks,
      favorites: inboundState.favorites,
      active: inboundState.active
    }
  },
  // transform state after it gets rehydrated
  (outboundState: NetworkState) => {
    return {
      networks: {},
      customNetworks: outboundState.customNetworks,
      favorites: outboundState.favorites,
      active: outboundState.active
    }
  },
  {
    whitelist: [reducerName]
  }
)
