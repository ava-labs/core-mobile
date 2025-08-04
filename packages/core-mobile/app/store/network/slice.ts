import {
  BITCOIN_NETWORK,
  ChainId as ChainsSDKChainId,
  Network
} from '@avalabs/core-chains-sdk'
import {
  createAction,
  createSelector,
  createSlice,
  PayloadAction
} from '@reduxjs/toolkit'
import { getNetworksFromCache } from 'hooks/networks/utils/getNetworksFromCache'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { selectIsSolanaSupportBlocked } from 'store/posthog'
import { RootState } from '../types'
import { ChainID, Networks, NetworkState } from './types'

export const defaultNetwork = BITCOIN_NETWORK

export const noActiveNetwork = 0

export const defaultEnabledL2ChainIds = [
  42161, // Arbitrum One
  // 421614, // Arbitrum Sepolia
  10, // Optimism
  // 11155420, // Optimism Sepolia
  8453 // Base Mainnet
  // 84532 // Base Sepolia
]

export const alwaysEnabledChainIds = [
  ChainsSDKChainId.AVALANCHE_MAINNET_ID,
  ChainsSDKChainId.AVALANCHE_TESTNET_ID,
  ChainsSDKChainId.AVALANCHE_P,
  ChainsSDKChainId.AVALANCHE_TEST_P,
  ChainsSDKChainId.BITCOIN,
  ChainsSDKChainId.BITCOIN_TESTNET,
  ChainsSDKChainId.ETHEREUM_HOMESTEAD,
  ChainsSDKChainId.ETHEREUM_TEST_SEPOLIA,
  ChainsSDKChainId.SOLANA_MAINNET_ID,
  ChainsSDKChainId.SOLANA_DEVNET_ID,
  ChainsSDKChainId.SOLANA_TESTNET_ID
]

export const reducerName = 'network'

const initialState: NetworkState = {
  customNetworks: {},
  enabledChainIds: alwaysEnabledChainIds,
  disabledLastTransactedChainIds: [],
  active: noActiveNetwork
}

export const networkSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    setActive: (state, action: PayloadAction<number>) => {
      state.active = action.payload
    },
    toggleEnabledChainId: (state, action: PayloadAction<number>) => {
      const chainId = action.payload
      if (!state.enabledChainIds.includes(chainId)) {
        // set enabledChainIds
        state.enabledChainIds.push(chainId)
      } else {
        if (alwaysEnabledChainIds.includes(chainId)) {
          return
        }
        // unset enabledChainIds
        const newEnabled = state.enabledChainIds.filter(id => id !== chainId)
        state.enabledChainIds = newEnabled
      }
    },
    enableL2ChainIds: state => {
      defaultEnabledL2ChainIds.forEach(chainId => {
        if (!state.enabledChainIds.includes(chainId)) {
          // set enabledChainIds
          state.enabledChainIds.push(chainId)
        }
      })
    },
    toggleDisabledLastTransactedChainId: (
      state,
      action: PayloadAction<number>
    ) => {
      const chainId = action.payload
      if (!state.disabledLastTransactedChainIds.includes(chainId)) {
        // set disabledLastTransactedChainIds
        state.disabledLastTransactedChainIds.push(chainId)
      } else {
        if (alwaysEnabledChainIds.includes(chainId)) {
          return
        }
        // unset disabledLastTransactedChainIds
        const newDisabled = state.disabledLastTransactedChainIds.filter(
          id => id !== chainId
        )
        state.disabledLastTransactedChainIds = newDisabled
      }
    },

    addCustomNetwork: (state, action: PayloadAction<Network>) => {
      const network = action.payload
      state.customNetworks[network.chainId] = network
    },
    updateCustomNetwork: (
      state,
      action: PayloadAction<{ chainId: ChainID; network: Network }>
    ) => {
      const chainId = action.payload.chainId
      const network = action.payload.network

      if (chainId === network.chainId) {
        state.customNetworks[chainId] = network
      } else {
        delete state.customNetworks[chainId]
        state.customNetworks[network.chainId] = network
      }
    },
    removeCustomNetwork: (state, action: PayloadAction<ChainID>) => {
      const chainId = action.payload
      delete state.customNetworks[chainId]

      // remove chainId from enabledChainIds if it exists
      if (state.enabledChainIds.includes(chainId)) {
        state.enabledChainIds = state.enabledChainIds.filter(
          id => id !== chainId
        )
      }
    }
  }
})

// selectors
export const selectActiveChainId = (state: RootState): number =>
  state.network.active

export const selectEnabledChainIds = (state: RootState): number[] =>
  state.network.enabledChainIds

export const selectCustomNetworks = (state: RootState): Networks =>
  state.network.customNetworks

export const selectActiveNetwork = (state: RootState): Network => {
  const activeChainId = selectActiveChainId(state)
  const networks = selectNetworks(state)
  if (networks === undefined) return defaultNetwork
  const network = networks[activeChainId]
  return network === undefined ? defaultNetwork : network
}

export const selectAllNetworks = (state: RootState): Networks => {
  const isSolanaSupportBlocked = selectIsSolanaSupportBlocked(state)
  const rawNetworks = getNetworksFromCache({
    includeSolana: !isSolanaSupportBlocked
  })
  const customNetworks = selectCustomNetworks(state)
  return { ...rawNetworks, ...customNetworks }
}

export const selectNetwork =
  (chainId: number) =>
  (state: RootState): Network | undefined => {
    const allNetworks = selectAllNetworks(state)
    return allNetworks[chainId]
  }

export const selectNetworks = (state: RootState): Networks => {
  const isDeveloperMode = selectIsDeveloperMode(state)
  const customNetworks = selectCustomNetworks(state)
  const isSolanaSupportBlocked = selectIsSolanaSupportBlocked(state)
  const rawNetworks = getNetworksFromCache({
    includeSolana: !isSolanaSupportBlocked
  })

  const populatedNetworks = Object.keys(rawNetworks ?? {}).reduce(
    (reducedNetworks, key) => {
      const chainId = parseInt(key)
      const network = rawNetworks?.[chainId]
      if (network && network.isTestnet === isDeveloperMode) {
        reducedNetworks[chainId] = network
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
        reducedNetworks[chainId] = network
      }
      return reducedNetworks
    },
    {} as Record<number, Network>
  )
  return { ...populatedNetworks, ...populatedCustomNetworks }
}

export const selectEnabledNetworks = createSelector(
  [selectEnabledChainIds, selectIsDeveloperMode, selectNetworks],
  (enabledChainIds, isDeveloperMode, networks) => {
    return enabledChainIds.reduce((acc, chainId) => {
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

export const onNetworksFetchedSuccess = createAction(
  `${reducerName}/onNetworksFetchedSuccess`
)

export const {
  setActive,
  toggleEnabledChainId,
  toggleDisabledLastTransactedChainId,
  addCustomNetwork,
  removeCustomNetwork,
  updateCustomNetwork,
  enableL2ChainIds
} = networkSlice.actions

export const networkReducer = networkSlice.reducer
