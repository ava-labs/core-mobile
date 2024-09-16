import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'store'
import {
  AppConfig,
  BridgeConfig,
  CriticalConfig
} from '@avalabs/core-bridge-sdk'
import { initialState } from 'store/bridge/types'

export const reducerName = 'bridge'

export const bridgeSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    popBridgeTransaction: (state, action: PayloadAction<string>) => {
      const sourceTxHash = action.payload
      delete state.bridgeTransactions[sourceTxHash]
    },
    setConfig: (state, action: PayloadAction<BridgeConfig>) => {
      state.config = action.payload
    }
  }
})

export const selectBridgeConfig = (
  state: RootState
): BridgeConfig | undefined => state.bridge.config

export const selectBridgeAppConfig = (
  state: RootState
): AppConfig | undefined => state.bridge.config?.config

export const selectBridgeCriticalConfig = (
  state: RootState
): CriticalConfig | undefined => {
  if (state.bridge.config && state.bridge.config.config) {
    return {
      critical: state.bridge.config.config.critical,
      criticalBitcoin: state.bridge.config.config.criticalBitcoin
    }
  }
}

export const { popBridgeTransaction, setConfig } = bridgeSlice.actions

export const bridgeReducer = bridgeSlice.reducer
