import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import {
  FUJI_NETWORK,
  MAINNET_NETWORK,
  setNetwork
} from '@avalabs/wallet-react-components'
import {
  getChainsAndTokens,
  Network,
  ChainId,
  BITCOIN_NETWORK,
  BITCOIN_TEST_NETWORK
} from '@avalabs/chains-sdk'
import { onRehydrationComplete } from 'store/app'
import { AppStartListening } from 'store/middleware/listener'
import { RootState } from '../index'
import { NetworkState } from './types'

const reducerName = 'network'

const initialState: NetworkState = {
  networks: {},
  favorites: [],
  active: 0 // no active network
}

export const networkSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    setNetworks: (state, action: PayloadAction<Record<string, Network>>) => {
      state.networks = action.payload
      state.favorites = Object.keys(action.payload)
    },
    setActive: (state, action: PayloadAction<number>) => {
      state.active = action.payload
    },
    toggleFavorite: (state, action: PayloadAction<number>) => {
      const chainId = action.payload
      if (!state.favorites.includes(chainId.toString())) {
        // set favorite
        state.favorites.push(chainId.toString())
      } else {
        // unset favorite
        const newFavorites = state.favorites.filter(
          id => id !== chainId.toString()
        )
        state.favorites = newFavorites
      }
    }
  }
})

// selectors
// TODO remove {}
export const selectActiveNetwork = (state: RootState) =>
  state.network.networks[state.network.active] ?? {}

export const selectActiveTokens = (state: RootState) => {
  const { networkToken, tokens } = selectActiveNetwork(state)
  if (tokens) {
    return [networkToken, ...tokens]
  } else {
    return [networkToken]
  }
}

export const selectNetworks = (state: RootState) => state.network.networks

export const selectFavoriteNetworks = (state: RootState) =>
  state.network.favorites.map(id => state.network.networks[id])

export const selectAvaxMainnet = (state: RootState) =>
  state.network.networks[ChainId.AVALANCHE_MAINNET_ID] ?? {}

export const selectAvaxTestnet = (state: RootState) =>
  state.network.networks[ChainId.AVALANCHE_TESTNET_ID] ?? {}

// actions
export const getNetworks = createAsyncThunk(
  `${reducerName}/getNetworks`,
  async (params, thunkAPI) => {
    const dispatch = thunkAPI.dispatch

    const erc20Networks = await getChainsAndTokens()
    const networks = {
      ...erc20Networks,
      [ChainId.BITCOIN]: BITCOIN_NETWORK,
      [ChainId.BITCOIN_TESTNET]: BITCOIN_TEST_NETWORK
    }
    dispatch(setNetworks(networks))

    dispatch(setActive(ChainId.AVALANCHE_MAINNET_ID))
  }
)

export const { setNetworks, setActive, toggleFavorite } = networkSlice.actions

// listeners
export const addNetworkListeners = (startListening: AppStartListening) => {
  startListening({
    actionCreator: onRehydrationComplete,
    effect: async (action, listenerApi) => {
      const state = listenerApi.getState()

      // TODO: remove this once network refactor is done
      // wallet-react-components sets MAINNET as the active network on app start
      // we need to set it back to whatever network persisted in our app
      const network = selectActiveNetwork(state)
      setNetwork(network.isTestnet ? FUJI_NETWORK : MAINNET_NETWORK)
    }
  })

  startListening({
    actionCreator: setActive,
    effect: async (action, listenerApi) => {
      const state = listenerApi.getState()

      // TODO: remove this once network refactor is done
      // for now, still need to also set active network in wallet-react-components
      const network = selectActiveNetwork(state)
      setNetwork(network.isTestnet ? FUJI_NETWORK : MAINNET_NETWORK)
    }
  })
}

// types
export * from './types'

export default networkSlice.reducer
