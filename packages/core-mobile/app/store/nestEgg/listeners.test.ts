import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit'
import { FeatureGates } from 'services/posthog/types'
import { WalletType } from 'services/wallet/types'
import { AppStartListening } from 'store/types'
import { DefaultFeatureFlagConfig } from 'store/posthog/types'
import { nestEggReducer, initialState as nestEggInitialState } from './slice'
import { swapCompleted, addNestEggListeners } from './listeners'
import { MINIMUM_SWAP_AMOUNT_USD } from './types'

// Mock the navigation and analytics
jest.mock('common/utils/navigateWithPromise', () => ({
  navigateWithPromise: jest.fn().mockResolvedValue(undefined)
}))

jest.mock('common/utils/waitForInteractions', () => ({
  waitForInteractions: jest.fn().mockResolvedValue(undefined)
}))

jest.mock('services/analytics/AnalyticsService', () => ({
  capture: jest.fn(),
  captureWithEncryption: jest.fn()
}))

jest.mock('services/network/utils/isAvalancheNetwork', () => ({
  isAvalancheCChainId: jest.fn((chainId: number) => chainId === 43114)
}))

const C_CHAIN_ID = 43114
const ETHEREUM_CHAIN_ID = 1

const listenerMiddleware = createListenerMiddleware()

const createTestStore = (
  overrides: {
    nestEggState?: Partial<typeof nestEggInitialState>
    walletType?: WalletType
    featureFlags?: Partial<typeof DefaultFeatureFlagConfig>
    coreAnalytics?: boolean | undefined
  } = {}
) => {
  const {
    nestEggState = {},
    walletType = WalletType.SEEDLESS,
    featureFlags = {
      [FeatureGates.EVERYTHING]: true,
      [FeatureGates.NEST_EGG_CAMPAIGN]: true
    },
    coreAnalytics = true
  } = overrides

  listenerMiddleware.clearListeners()

  const store = configureStore({
    reducer: {
      nestEgg: nestEggReducer,
      app: () => ({ walletType }),
      posthog: () => ({
        featureFlags: { ...DefaultFeatureFlagConfig, ...featureFlags }
      }),
      settings: () => ({
        securityPrivacy: { coreAnalytics }
      })
    },
    preloadedState: {
      nestEgg: { ...nestEggInitialState, ...nestEggState }
    },
    middleware: gDM =>
      gDM({ serializableCheck: false }).prepend(listenerMiddleware.middleware)
  })

  addNestEggListeners(listenerMiddleware.startListening as AppStartListening)

  return store
}

describe('nestEgg listeners', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('swapCompleted action', () => {
    it('should qualify user for C-Chain swap >= $10', async () => {
      const store = createTestStore()

      store.dispatch(
        swapCompleted({
          txHash: '0x123',
          chainId: C_CHAIN_ID,
          fromTokenSymbol: 'AVAX',
          toTokenSymbol: 'USDC',
          fromAmountUsd: 15,
          toAmountUsd: 14.9
        })
      )

      // Wait for listener to process
      await new Promise(resolve => setTimeout(resolve, 100))

      const state = store.getState()
      expect(state.nestEgg.hasQualified).toBe(true)
      expect(state.nestEgg.qualifyingTxHash).toBe('0x123')
      expect(state.nestEgg.qualifiedAt).toBeDefined()
    })

    it('should NOT qualify user for swap below $10', async () => {
      const store = createTestStore()

      store.dispatch(
        swapCompleted({
          txHash: '0x123',
          chainId: C_CHAIN_ID,
          fromTokenSymbol: 'AVAX',
          toTokenSymbol: 'USDC',
          fromAmountUsd: 9.99,
          toAmountUsd: 9.9
        })
      )

      await new Promise(resolve => setTimeout(resolve, 100))

      const state = store.getState()
      expect(state.nestEgg.hasQualified).toBe(false)
    })

    it('should NOT qualify user for non-C-Chain swap', async () => {
      const store = createTestStore()

      store.dispatch(
        swapCompleted({
          txHash: '0x123',
          chainId: ETHEREUM_CHAIN_ID,
          fromTokenSymbol: 'ETH',
          toTokenSymbol: 'USDC',
          fromAmountUsd: 100,
          toAmountUsd: 99
        })
      )

      await new Promise(resolve => setTimeout(resolve, 100))

      const state = store.getState()
      expect(state.nestEgg.hasQualified).toBe(false)
    })

    it('should NOT qualify user when already qualified', async () => {
      const store = createTestStore({
        nestEggState: {
          hasQualified: true,
          qualifyingTxHash: '0xold',
          qualifiedAt: 1000000
        }
      })

      store.dispatch(
        swapCompleted({
          txHash: '0xnew',
          chainId: C_CHAIN_ID,
          fromTokenSymbol: 'AVAX',
          toTokenSymbol: 'USDC',
          fromAmountUsd: 100,
          toAmountUsd: 99
        })
      )

      await new Promise(resolve => setTimeout(resolve, 100))

      const state = store.getState()
      // Should still have the old tx hash
      expect(state.nestEgg.qualifyingTxHash).toBe('0xold')
    })

    it('should NOT qualify user when flags are disabled', async () => {
      const store = createTestStore({
        featureFlags: {
          [FeatureGates.EVERYTHING]: true,
          [FeatureGates.NEST_EGG_CAMPAIGN]: false,
          [FeatureGates.NEST_EGG_NEW_SEEDLESS_ONLY]: false
        }
      })

      store.dispatch(
        swapCompleted({
          txHash: '0x123',
          chainId: C_CHAIN_ID,
          fromTokenSymbol: 'AVAX',
          toTokenSymbol: 'USDC',
          fromAmountUsd: 100,
          toAmountUsd: 99
        })
      )

      await new Promise(resolve => setTimeout(resolve, 100))

      const state = store.getState()
      expect(state.nestEgg.hasQualified).toBe(false)
    })

    it('should NOT qualify user when not seedless wallet', async () => {
      const store = createTestStore({
        walletType: WalletType.MNEMONIC
      })

      store.dispatch(
        swapCompleted({
          txHash: '0x123',
          chainId: C_CHAIN_ID,
          fromTokenSymbol: 'AVAX',
          toTokenSymbol: 'USDC',
          fromAmountUsd: 100,
          toAmountUsd: 99
        })
      )

      await new Promise(resolve => setTimeout(resolve, 100))

      const state = store.getState()
      expect(state.nestEgg.hasQualified).toBe(false)
    })

    it('should NOT qualify user who opted out of airdrops', async () => {
      const store = createTestStore({
        coreAnalytics: false
      })

      store.dispatch(
        swapCompleted({
          txHash: '0x123',
          chainId: C_CHAIN_ID,
          fromTokenSymbol: 'AVAX',
          toTokenSymbol: 'USDC',
          fromAmountUsd: 100,
          toAmountUsd: 99
        })
      )

      await new Promise(resolve => setTimeout(resolve, 100))

      const state = store.getState()
      expect(state.nestEgg.hasQualified).toBe(false)
    })

    it('should qualify exactly at $10 threshold', async () => {
      const store = createTestStore()

      store.dispatch(
        swapCompleted({
          txHash: '0x123',
          chainId: C_CHAIN_ID,
          fromTokenSymbol: 'AVAX',
          toTokenSymbol: 'USDC',
          fromAmountUsd: MINIMUM_SWAP_AMOUNT_USD,
          toAmountUsd: 9.9
        })
      )

      await new Promise(resolve => setTimeout(resolve, 100))

      const state = store.getState()
      expect(state.nestEgg.hasQualified).toBe(true)
    })
  })
})
