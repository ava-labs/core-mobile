import {
  createAction,
  createAsyncThunk,
  createSlice,
  PayloadAction
} from '@reduxjs/toolkit'
import { ChainId, Network } from '@avalabs/chains-sdk'
import isEmpty from 'lodash.isempty'
import NetworkService from 'services/network/NetworkService'
import { AppStartListening } from 'store/middleware/listener'
import { setBridgeFilter } from 'store/bridge/BridgeReducer'
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
    setActiveNetwork: (state, action: PayloadAction<number>) => {
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
  state.network.favorites.map((id: number) => state.network.networks[id])

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

    const networks = await NetworkService.getNetworks()
    dispatch(setNetworks(networks))

    const network = selectActiveNetwork(state)

    if (isEmpty(network)) {
      dispatch(setActive(ChainId.AVALANCHE_TESTNET_ID))
    }
  }
)

export const setActive = createAction<number>(`${reducerName}/setActive`)
export const { setNetworks, toggleFavorite } = networkSlice.actions
const { setActiveNetwork } = networkSlice.actions

export const addSetActiveListener = (startListening: AppStartListening) => {
  startListening({
    actionCreator: setActive,
    effect: (action, listenerApi) => {
      listenerApi.dispatch(setActiveNetwork(action.payload))

      // not sure if this is the best way to add a dependency
      // to setActiveNetwork...but it works :)
      const state = listenerApi.getState()
      const networks = selectNetworks(state)
      // updates bridge isMainnet filter based on selected network
      listenerApi.dispatch(setBridgeFilter(!networks[action.payload].isTestnet))
    }
  })
}

export const networkReducer = networkSlice.reducer
