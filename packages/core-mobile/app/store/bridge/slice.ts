import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'store'
import {
  AppConfig,
  BridgeConfig,
  BridgeTransaction,
  CriticalConfig
} from '@avalabs/bridge-sdk'
import { BridgeState, initialState } from 'store/bridge/types'
import { selectActiveNetwork } from 'store/network'

export const reducerName = 'bridge'

export const bridgeSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    addBridgeTransaction: (state, action: PayloadAction<BridgeTransaction>) => {
      const bridgeTx = action.payload
      state.bridgeTransactions[bridgeTx.sourceTxHash] = bridgeTx
    },
    popBridgeTransaction: (state, action: PayloadAction<string>) => {
      const sourceTxHash = action.payload
      delete state.bridgeTransactions[sourceTxHash]
    },
    setConfig: (state, action: PayloadAction<BridgeConfig>) => {
      state.config = action.payload
    }
  }
})

const selectTransactions = (
  state: RootState
): {
  [key: string]: BridgeTransaction
} => state.bridge.bridgeTransactions

export const selectBridgeConfig = (
  state: RootState
): BridgeConfig | undefined => state.bridge.config

export const selectBridgeAppConfig = (
  state: RootState
): AppConfig | undefined => state.bridge.config?.config

export const selectBridgeCriticalConfig = createSelector(
  [selectBridgeConfig, selectBridgeAppConfig],
  (bridgeConfig, bridgeAppConfig): CriticalConfig | undefined => {
    if (bridgeConfig?.config && bridgeAppConfig) {
      return {
        critical: bridgeConfig.config.critical,
        criticalBitcoin: bridgeAppConfig.criticalBitcoin
      }
    }
  }
)

export const selectBridgeTransactions = createSelector(
  [selectTransactions, selectActiveNetwork],
  (bridgeTransactions, activeNetwork) => {
    return Object.values(bridgeTransactions).reduce<
      BridgeState['bridgeTransactions']
    >((txs, btx) => {
      const isMainnet = !activeNetwork.isTestnet
      // go figure
      const bridgeTx = btx as BridgeTransaction
      if (bridgeTx.environment === (isMainnet ? 'main' : 'test')) {
        txs[bridgeTx.sourceTxHash] = bridgeTx
      }
      return txs
    }, {})
  }
)

export const { addBridgeTransaction, popBridgeTransaction, setConfig } =
  bridgeSlice.actions

export const bridgeReducer = bridgeSlice.reducer
