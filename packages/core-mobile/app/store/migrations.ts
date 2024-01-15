import { ChainId } from '@avalabs/chains-sdk'
import StorageTools from 'repository/StorageTools'
import BiometricsSDK from 'utils/BiometricsSDK'
import { WalletType } from 'services/wallet/types'
import { initialState as watchlistInitialState } from './watchlist'
import {
  DefaultFeatureFlagConfig,
  initialState as posthogInitialState
} from './posthog'
import { initialState as browserFavoritesInitialState } from './browser/slices/favorites'
import { getInitialState as browserTabsGetInitialState } from './browser/slices/tabs'
import { initialState as browserGlobalHistoryInitialState } from './browser/slices/globalHistory'
/* eslint-disable @typescript-eslint/no-explicit-any */
export const migrations = {
  1: (state: any) => {
    // replace watchlist store
    return {
      ...state,
      watchlist: {
        tokens: [],
        favorites: []
      }
    }
  },
  2: (state: any) => {
    // expand nft store with nfts
    return {
      ...state,
      nft: {
        ...state.nft,
        nfts: {}
      }
    }
  },
  3: (state: any) => {
    return {
      ...state,
      watchlist: watchlistInitialState
    }
  },
  4: (state: any) => {
    return {
      ...state,
      posthog: {
        distinctID: posthogInitialState.distinctID,
        userID: state.posthog.userID
      }
    }
  },
  5: (state: any) => {
    // migrate BTC and BTC testnet chainIds
    const updatedFavorites = state.network.favorites.map((chainId: number) => {
      if (chainId === -1) {
        return ChainId.BITCOIN
      }

      if (chainId === -2) {
        return ChainId.BITCOIN_TESTNET
      }

      return chainId
    })

    let updatedActive = state.network.active

    if (updatedActive === -1) {
      updatedActive = ChainId.BITCOIN
    } else if (updatedActive === -2) {
      updatedActive = ChainId.BITCOIN_TESTNET
    }

    return {
      ...state,
      network: {
        ...state.network,
        favorites: updatedFavorites,
        active: updatedActive
      }
    }
  },
  6: async (state: any) => {
    const map = await StorageTools.loadFromStorageAsMap<
      'CoreAnalytics' | 'ConsentToTOU&PP',
      boolean | undefined
    >('USER_SETTINGS')

    const coreAnalytics = map.get('CoreAnalytics')
    const consentToTOUnPP = Boolean(map.get('ConsentToTOU&PP'))

    return {
      ...state,
      settings: {
        ...state.settings,
        securityPrivacy: {
          coreAnalytics: coreAnalytics,
          consentToTOUnPP
        }
      }
    }
  },
  7: (state: any) => {
    if (state.posthog.featureFlags === undefined) {
      return {
        ...state,
        posthog: {
          ...state.posthog,
          featureFlags: DefaultFeatureFlagConfig
        }
      }
    }

    return state
  },
  8: (state: any) => {
    delete state.walletConnect
    return state
  },
  9: async (state: any) => {
    // for people upgrading from < 9, if they have set biometrics or pin,
    // it means they have created a mnemonic wallet
    const isLoggedIn = await BiometricsSDK.getAccessType()

    return {
      ...state,
      app: {
        ...state.app,
        walletType: isLoggedIn ? WalletType.MNEMONIC : WalletType.UNSET
      }
    }
  },
  10: async (state: any) => {
    return {
      ...state,
      // reset browser data
      browser: {
        favorites: browserFavoritesInitialState,
        globalHistory: browserGlobalHistoryInitialState,
        tabs: browserTabsGetInitialState()
      },
      // set security countdown
      security: {
        loginAttempt: {
          count: state.security.loginAttempt.count,
          countdown: 0
        }
      }
    }
  }
}
