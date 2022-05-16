import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../index'
import {
  supportedNetworks,
  MAINNET_NETWORK,
  FUJI_NETWORK,
  BITCOIN_NETWORK,
  NetworkState
} from './types'

const initialState: NetworkState = {
  networks: supportedNetworks,
  favorites: [
    MAINNET_NETWORK.chainId,
    FUJI_NETWORK.chainId,
    BITCOIN_NETWORK.chainId
  ],
  active: MAINNET_NETWORK.chainId
}

export const networkSlice = createSlice({
  name: 'network',
  initialState,
  reducers: {
    setActive: (state, action: PayloadAction<string>) => {
      state.active = action.payload
    },
    toggleFavorite: (state, action: PayloadAction<string>) => {
      const chainId = action.payload
      if (!state.favorites.includes(chainId)) {
        // set favorite
        state.favorites.push(chainId)
      } else {
        // unset favorite
        const newFavorites = state.favorites.filter(id => id !== chainId)
        state.favorites = newFavorites
      }
    }
  }
})

// selectors
export const selectActiveNetwork = (state: RootState) =>
  state.network.networks[state.network.active]

export const selectNetworks = (state: RootState) => state.network.networks

export const selectFavoriteNetworks = (state: RootState) =>
  state.network.favorites.map(id => state.network.networks[id])

// actions
export const { setActive, toggleFavorite } = networkSlice.actions

// types
export * from './types'

export default networkSlice.reducer
