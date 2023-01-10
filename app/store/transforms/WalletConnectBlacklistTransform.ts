import { createTransform } from 'redux-persist'
import { RawRootState } from 'store'
import { WalletConnectState } from 'store/walletConnect'

// a transform for walletConnect to blacklist requests
export const WalletConnectBlacklistTransform = createTransform<
  WalletConnectState,
  WalletConnectState,
  RawRootState,
  RawRootState
>(
  // transform state before it gets serialized and persisted
  (inboundState: WalletConnectState) => {
    return {
      requests: [],
      approvedDApps: inboundState.approvedDApps
    }
  },
  // transform state after it gets rehydrated
  (outboundState: WalletConnectState) => {
    return {
      requests: [],
      approvedDApps: outboundState.approvedDApps
    }
  },
  {
    whitelist: ['walletConnect']
  }
)
