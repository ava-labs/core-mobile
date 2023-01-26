import { createTransform } from 'redux-persist'
import { RawRootState } from 'store'
import { WalletConnectState, reducerName } from 'store/walletConnect'

// a transform for walletConnect to blacklist requests and requestStatuses
export const WalletConnectBlacklistTransform = createTransform<
  WalletConnectState,
  WalletConnectState,
  RawRootState,
  RawRootState
>(
  // transform state before it gets serialized and persisted
  (inboundState: WalletConnectState) => {
    return {
      ...inboundState,
      requests: [],
      requestStatuses: {}
    }
  },
  // transform state after it gets rehydrated
  (outboundState: WalletConnectState) => {
    return {
      ...outboundState,
      requests: [],
      requestStatuses: {}
    }
  },
  {
    whitelist: [reducerName]
  }
)
