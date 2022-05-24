import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { setNetwork } from '@avalabs/wallet-react-components'
import { onStorageReady } from 'store/actions'
import { AppStartListening } from 'store/middleware/listener'
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

// listeners
export const addNetworkListeners = (startListening: AppStartListening) => {
  startListening({
    actionCreator: onStorageReady,
    effect: async (action, listenerApi) => {
      const state = listenerApi.getState()

      // TODO: remove this once network refactor is done
      // wallet-react-components sets MAINNET as the active network on app start
      // we need to set it back to whatever network persisted in our app
      const network = selectActiveNetwork(state)
      setNetwork(network)
    }
  })

  startListening({
    actionCreator: setActive,
    effect: async (action, listenerApi) => {
      const state = listenerApi.getState()

      // TODO: remove this once network refactor is done
      // for now, still need to also set active network in wallet-react-components
      const network = selectActiveNetwork(state)
      setNetwork(network)
    }
  })
}

// types
export * from './types'

export default networkSlice.reducer
