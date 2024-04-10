import { createAction, createSlice, PayloadAction } from '@reduxjs/toolkit'
import {
  BITCOIN_NETWORK,
  ChainId as ChainsSDKChainId,
  Network
} from '@avalabs/chains-sdk'
import { RootState } from '../index'
import { ChainID, Networks, NetworkState } from './types'

export const defaultNetwork = BITCOIN_NETWORK

export const noActiveNetwork = 0

export const alwaysFavoriteNetworks = [
  ChainsSDKChainId.AVALANCHE_MAINNET_ID,
  ChainsSDKChainId.AVALANCHE_TESTNET_ID
]

export const reducerName = 'network'

const initialState: NetworkState = {
  customNetworks: {},
  favorites: [
    ...alwaysFavoriteNetworks,
    ChainsSDKChainId.BITCOIN,
    ChainsSDKChainId.BITCOIN_TESTNET,
    ChainsSDKChainId.ETHEREUM_HOMESTEAD
  ],
  active: noActiveNetwork
}

export const networkSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    setActive: (state, action: PayloadAction<number>) => {
      state.active = action.payload
    },
    toggleFavorite: (state, action: PayloadAction<number>) => {
      const chainId = action.payload
      if (!state.favorites.includes(chainId)) {
        // set favorite
        state.favorites.push(chainId)
      } else {
        if (alwaysFavoriteNetworks.includes(chainId)) {
          return
        }
        // unset favorite
        const newFavorites = state.favorites.filter(id => id !== chainId)
        state.favorites = newFavorites
      }
    },
    addCustomNetwork: (state, action: PayloadAction<Network>) => {
      const network = action.payload
      state.customNetworks[network.chainId] = network
    },
    removeCustomNetwork: (state, action: PayloadAction<ChainID>) => {
      const chainId = action.payload
      delete state.customNetworks[chainId]
    }
  }
})

// selectors
export const selectActiveChainId = (state: RootState): number =>
  state.network.active

export const selectFavorites = (state: RootState): number[] =>
  state.network.favorites

export const selectCustomNetworks = (state: RootState): Networks =>
  state.network.customNetworks

export const setNetworks = createAction(`${reducerName}/setNetworks`)

export const {
  setActive,
  toggleFavorite,
  addCustomNetwork,
  removeCustomNetwork
} = networkSlice.actions

export const networkReducer = networkSlice.reducer
