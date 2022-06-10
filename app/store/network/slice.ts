import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import {
  BITCOIN_NETWORK,
  ChainId,
  ETHEREUM_NETWORK,
  getChainsAndTokens,
  Network
} from '@avalabs/chains-sdk'
import isEmpty from 'lodash.isempty'
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

export const selectNetworks = (state: RootState) => state.network.networks

export const selectFavoriteNetworks = (state: RootState) =>
  state.network.favorites.map(id => state.network.networks[id])

export const selectAvaxMainnet = (state: RootState) =>
  state.network.networks[ChainId.AVALANCHE_MAINNET_ID] ?? {}

export const selectAvaxTestnet = (state: RootState) =>
  state.network.networks[ChainId.AVALANCHE_TESTNET_ID] ?? {}

// actions
export const getNetworks = createAsyncThunk<void, void, { state: RootState }>(
  `${reducerName}/getNetworks`,
  async (params, thunkAPI) => {
    const dispatch = thunkAPI.dispatch
    const state = thunkAPI.getState()

    const erc20Networks = await getChainsAndTokens()
    const networks = {
      ...erc20Networks,
      [ChainId.BITCOIN]: BITCOIN_NETWORK,
      [ChainId.ETHEREUM_HOMESTEAD]: ETHEREUM_NETWORK
    }
    dispatch(setNetworks(networks))

    const network = selectActiveNetwork(state)

    if (isEmpty(network)) {
      dispatch(setActive(ChainId.AVALANCHE_MAINNET_ID))
    }
  }
)

export const { setNetworks, setActive, toggleFavorite } = networkSlice.actions

export const networkReducer = networkSlice.reducer
