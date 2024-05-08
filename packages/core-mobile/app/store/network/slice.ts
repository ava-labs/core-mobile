import {
  createAction,
  createSelector,
  createSlice,
  PayloadAction
} from '@reduxjs/toolkit'
import {
  BITCOIN_NETWORK,
  ChainId as ChainsSDKChainId,
  Network
} from '@avalabs/chains-sdk'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { selectAllCustomTokens } from 'store/customToken'
import { getNetworksFromCache } from 'hooks/networks/utils/getNetworksFromCache'
import { RootState } from '../index'
import { ChainID, Networks, NetworkState } from './types'
import { mergeWithCustomTokens } from './utils'

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

export const selectNetworks = createSelector(
  [selectAllCustomTokens, selectIsDeveloperMode, selectCustomNetworks],
  (allCustomTokens, isDeveloperMode, customNetworks) => {
    const rawNetworks = getNetworksFromCache()
    const populatedNetworks = Object.keys(rawNetworks ?? {}).reduce(
      (reducedNetworks, key) => {
        const chainId = parseInt(key)
        const network = rawNetworks?.[chainId]
        if (network && network.isTestnet === isDeveloperMode) {
          reducedNetworks[chainId] = mergeWithCustomTokens(
            network,
            allCustomTokens
          )
        }
        return reducedNetworks
      },
      {} as Record<number, Network>
    )
    const populatedCustomNetworks = Object.keys(customNetworks).reduce(
      (reducedNetworks, key) => {
        const chainId = parseInt(key)
        const network = customNetworks[chainId]
        if (network && network.isTestnet === isDeveloperMode) {
          reducedNetworks[chainId] = mergeWithCustomTokens(
            network,
            allCustomTokens
          )
        }
        return reducedNetworks
      },
      {} as Record<number, Network>
    )
    return { ...populatedNetworks, ...populatedCustomNetworks }
  }
)

export const selectActiveNetwork = createSelector(
  [selectActiveChainId, selectNetworks],
  (activeChainId, networks) => {
    if (networks === undefined) return defaultNetwork
    const network = networks[activeChainId]
    return network === undefined ? defaultNetwork : network
  }
)

export const selectAllNetworks = createSelector(
  [selectCustomNetworks],
  customNetworks => {
    const rawNetworks = getNetworksFromCache()
    return { ...rawNetworks, ...customNetworks }
  }
)

export const selectNetwork =
  (chainId: number) =>
  (state: RootState): Network | undefined => {
    const allNetworks = selectAllNetworks(state)
    return allNetworks[chainId]
  }

export const selectFavoriteNetworks = createSelector(
  [selectFavorites, selectIsDeveloperMode],
  (favorites, isDeveloperMode) => {
    const networks = getNetworksFromCache()
    if (networks === undefined) return []
    return favorites.reduce((acc, chainId) => {
      const network = networks[chainId]
      if (network && network.isTestnet === isDeveloperMode) {
        acc.push(network)
      }
      return acc
    }, [] as Network[])
  }
)

export const selectIsTestnet = (chainId: number) => (state: RootState) => {
  const networks = selectAllNetworks(state)
  const network = networks[chainId]
  return network?.isTestnet
}

export const onNetworksFetched = createAction(
  `${reducerName}/onNetworksFetched`
)

export const {
  setActive,
  toggleFavorite,
  addCustomNetwork,
  removeCustomNetwork
} = networkSlice.actions

export const networkReducer = networkSlice.reducer
