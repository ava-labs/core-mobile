import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'store'
import { BridgeState, initialState } from 'store/bridge/BridgeState'
import { BridgeTransaction } from '@avalabs/bridge-sdk'

const reducerName = 'bridge'

export const bridgeSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    addBridgeTransaction: (state, action: PayloadAction<BridgeTransaction>) => {
      const bridgeTx = action.payload
      const currentBridgeState = state.bridge

      state.bridge = {
        ...currentBridgeState,
        bridgeTransactions: {
          ...currentBridgeState.bridgeTransactions,
          [bridgeTx.sourceTxHash]: bridgeTx
        }
      }
    },
    popBridgeTransaction: (state, action: PayloadAction<string>) => {
      const sourceTxHash = action.payload
      const { [sourceTxHash]: unused, ...rest } =
        state.bridge.bridgeTransactions

      state.bridge = {
        ...state.bridge,
        bridgeTransactions: rest
      }
    },
    setBridgeFilter(state, action: PayloadAction<boolean>) {
      state.bridge.isMainnet = action.payload
    }
  }
})

export const selectBridge = (state: RootState) => state.bridge.bridge
export const selectBridgeTransactions = (state: RootState) => {
  return Object.values(state.bridge.bridge.bridgeTransactions).reduce<
    BridgeState['bridgeTransactions']
  >((txs, btx) => {
    // go figure
    const bridgeTx = btx as BridgeTransaction
    if (
      bridgeTx.environment === (state.bridge.bridge.isMainnet ? 'main' : 'test')
    ) {
      txs[bridgeTx.sourceTxHash] = bridgeTx
    }
    return txs
  }, {})
}

export const { addBridgeTransaction, popBridgeTransaction, setBridgeFilter } =
  bridgeSlice.actions
// export const bridgeTransactionListener = (
//   startListening: AppStartListening
// ) => {
//   startListening({
//     actionCreator: onRehydrationComplete,
//     effect: async (action, listenerApi) => {
//       const state = listenerApi.getState()
//       const bridgeState = selectBridgeState(state)
//     }
//   })
//
//   startListening({
//     actionCreator: createTransaction,
//     effect: async (action, listenerApi) => {
//       const { tx, bridgeConfig, account, network } = action.payload
//       const bridgeTransactions = selectTransactions(listenerApi.getState())
//
//       // if (!config || !network || !account) {
//       //   return Promise.reject('Wallet not ready')
//       // }
//
//       const {
//         sourceChain,
//         sourceTxHash,
//         sourceStartedAt,
//         targetChain,
//         amount,
//         symbol
//       } = tx
//
//       const addressC = account.address
//       const addressBTC = account.addressBtc
//       const isMainnet = !network.isTestnet
//       const environment = isMainnet ? 'main' : 'test'
//
//       if (!addressBTC) return { error: 'missing addressBTC' }
//       if (!addressC) return { error: 'missing addressC' }
//       if (!sourceChain) return { error: 'missing sourceChain' }
//       if (!sourceTxHash) return { error: 'missing sourceTxHash' }
//       if (!sourceStartedAt) return { error: 'missing sourceStartedAt' }
//       if (!targetChain) return { error: 'missing targetChain' }
//       if (!amount) return { error: 'missing amount' }
//       if (!symbol) return { error: 'missing symbol' }
//       if (!bridgeConfig.config) return { error: 'missing bridge config' }
//       if (bridgeTransactions[sourceTxHash])
//         return { error: 'bridge tx already exists' }
//
//       const requiredConfirmationCount = getMinimumConfirmations(
//         sourceChain,
//         bridgeConfig.config
//       )
//
//       const bridgeTransaction: BridgeTransaction = {
//         /* from params */
//         sourceChain,
//         sourceTxHash,
//         sourceStartedAt,
//         targetChain,
//         amount,
//         symbol,
//         /* new fields */
//         addressC,
//         addressBTC,
//         complete: false,
//         confirmationCount: 0,
//         environment,
//         requiredConfirmationCount
//       }
//       listenerApi.dispatch(addTransactionState(bridgeTransaction))
//       trackBridgeTransaction(bridgeTransaction, bridgeConfig)
//     }
//   })
// }
//
// async function trackBridgeTransaction(
//   bridgeTransaction: BridgeTransaction,
//   bridgeConfig: BridgeConfig
// ) {
//   const config = bridgeConfig?.config
//   if (!config) {
//     throw new Error('Bridge config not initialized')
//   }
//
//   const avalancheProvider = await this.networkService.getAvalancheProvider()
//   const ethereumProvider = await this.networkService.getEthereumProvider()
//   const bitcoinProvider = await this.networkService.getBitcoinProvider()
//
//   trackBridgeTransactionSDK({
//     bridgeTransaction,
//     onBridgeTransactionUpdate: this.saveBridgeTransaction.bind(this),
//     config,
//     avalancheProvider,
//     ethereumProvider,
//     bitcoinProvider
//   })
// }

export default bridgeSlice.reducer
