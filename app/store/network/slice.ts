import {
  createAsyncThunk,
  createSelector,
  createSlice,
  PayloadAction
} from '@reduxjs/toolkit'
import { BITCOIN_NETWORK, ChainId, Network } from '@avalabs/chains-sdk'
import NetworkService from 'services/network/NetworkService'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { selectAllCustomTokens } from 'store/customToken'
import { RootState } from '../index'
import { NetworkState } from './types'
import { mergeWithCustomTokens } from './utils'

const defaultNetwork = BITCOIN_NETWORK
const noActiveNetwork = 0

const reducerName = 'network'

const initialState: NetworkState = {
  networks: {},
  favorites: [],
  active: noActiveNetwork
}

export const networkSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    setNetworks: (state, action: PayloadAction<Record<number, Network>>) => {
      state.networks = action.payload
      state.favorites = Object.keys(action.payload).map(key =>
        parseInt(key, 10)
      )
    },
    setActive: (state, action: PayloadAction<number>) => {
      state.active = action.payload
    },
    toggleFavorite: (state, action: PayloadAction<number>) => {
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
const selectActiveChainId = (state: RootState) => state.network.active

const selectFavorites = (state: RootState) => state.network.favorites

export const selectNetworks = (state: RootState) => state.network.networks

export const selectActiveNetwork = createSelector(
  [selectNetworks, selectActiveChainId, selectAllCustomTokens],
  (networks, chainId, allCustomTokens) => {
    const network = networks[chainId]

    if (!network) return defaultNetwork

    return mergeWithCustomTokens(network, allCustomTokens)
  }
)

export const selectFavoriteNetworks = createSelector(
  [
    selectFavorites,
    selectNetworks,
    selectIsDeveloperMode,
    selectAllCustomTokens
  ],
  (favorites, networks, isDeveloperMode, allCustomTokens) => {
    return favorites
      .map(id => {
        const network = networks[id]
        return mergeWithCustomTokens(network, allCustomTokens)
      })
      .filter(network => network.isTestnet === isDeveloperMode)
  }
)

export const selectInactiveNetworks = createSelector(
  [selectActiveChainId, selectFavoriteNetworks],
  (activeChainId, favoriteNetworks) => {
    return favoriteNetworks.filter(network => network.chainId !== activeChainId)
  }
)

// get the list of contract tokens for the active network
export const selectNetworkContractTokens = (state: RootState) => {
  const network = selectActiveNetwork(state)
  return network.tokens ?? []
}

export const selectIsTestnet = (chainId: number) => (state: RootState) => {
  const network = state.network.networks[chainId]
  return network.isTestnet
}

// actions
export const getNetworks = createAsyncThunk<void, void, { state: RootState }>(
  `${reducerName}/getNetworks`,
  async (params, thunkAPI) => {
    const dispatch = thunkAPI.dispatch
    const state = thunkAPI.getState()

    const networks = await NetworkService.getNetworks()
    dispatch(setNetworks(networks))

    if (state.network.active === noActiveNetwork) {
      dispatch(setActive(ChainId.AVALANCHE_MAINNET_ID))
    }
  }
)

export const { setNetworks, setActive, toggleFavorite } = networkSlice.actions

export const networkReducer = networkSlice.reducer
