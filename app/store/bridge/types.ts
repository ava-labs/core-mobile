import { BridgeTransaction } from '@avalabs/bridge-sdk'

export interface BridgeState {
  bridgeTransactions: {
    [key: string]: BridgeTransaction
  }
  isMainnet: boolean
}

export interface BridgeReducerState {
  bridge: BridgeState
}

export const defaultBridgeState: BridgeState = {
  bridgeTransactions: {},
  isMainnet: false
}

export const initialState: BridgeReducerState = {
  bridge: defaultBridgeState
}
