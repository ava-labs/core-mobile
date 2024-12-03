import UnifiedBridgeService from 'services/bridge/UnifiedBridgeService'
import { BridgeType, Environment } from '@avalabs/bridge-unified'
import * as Toast from 'utils/toast'
import { FeatureGates } from 'services/posthog/types'
import { WalletState } from 'store/app'
import {
  initUnifiedBridgeService,
  checkTransferStatus,
  shouldReinitializeBridge
} from './listeners'

const mockShowTransactionSuccessToast = jest.fn()
jest
  .spyOn(Toast, 'showTransactionSuccessToast')
  .mockImplementation(mockShowTransactionSuccessToast)

jest.mock('services/bridge/UnifiedBridgeService')
jest.mock('store/rpc/utils/createInAppRequest')

const bitcoinProvider = {}
jest.mock('services/network/utils/providerUtils', () => ({
  getBitcoinProvider: jest.fn().mockResolvedValue(bitcoinProvider)
}))

const mockDispatch = jest.fn()
const mockListenerApi = {
  getState: () => ({
    app: { walletState: WalletState.ACTIVE },
    settings: { advanced: { developerMode: false } },
    posthog: {
      featureFlags: {
        [FeatureGates.EVERYTHING]: true
      }
    },
    unifiedBridge: {
      pendingTransfers: []
    }
  }),
  dispatch: mockDispatch
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any

describe('Unified Bridge Listeners', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('initUnifiedBridgeService', () => {
    it('should initialize service correctly when all feature gates are enabled', async () => {
      const mockState = {
        app: { walletState: WalletState.ACTIVE },
        settings: { advanced: { developerMode: false } },
        posthog: {
          featureFlags: {
            [FeatureGates.EVERYTHING]: true,
            [FeatureGates.UNIFIED_BRIDGE_CCTP]: true,
            [FeatureGates.UNIFIED_BRIDGE_ICTT]: true,
            [FeatureGates.UNIFIED_BRIDGE_AB_EVM]: true,
            [FeatureGates.UNIFIED_BRIDGE_AB_AVA_TO_BTC]: true,
            [FeatureGates.UNIFIED_BRIDGE_AB_BTC_TO_AVA]: true
          }
        },
        unifiedBridge: {
          pendingTransfers: []
        }
      }

      await initUnifiedBridgeService(
        {},
        {
          ...mockListenerApi,
          getState: () => mockState
        }
      )

      expect(UnifiedBridgeService.init).toHaveBeenCalledWith({
        enabledBridgeTypes: expect.arrayContaining([
          BridgeType.CCTP,
          BridgeType.ICTT_ERC20_ERC20,
          BridgeType.AVALANCHE_EVM,
          BridgeType.AVALANCHE_AVA_BTC,
          BridgeType.AVALANCHE_BTC_AVA
        ]),
        evmSigner: expect.any(Object),
        btcSigner: expect.any(Object),
        bitcoinProvider,
        environment: Environment.PROD
      })
    })

    it('should initialize service correctly when some feature gates are disabled', async () => {
      const mockState = {
        app: { walletState: WalletState.ACTIVE },
        settings: { advanced: { developerMode: false } },
        posthog: {
          featureFlags: {
            [FeatureGates.EVERYTHING]: true,
            [FeatureGates.UNIFIED_BRIDGE_CCTP]: false,
            [FeatureGates.UNIFIED_BRIDGE_ICTT]: true,
            [FeatureGates.UNIFIED_BRIDGE_AB_EVM]: false,
            [FeatureGates.UNIFIED_BRIDGE_AB_AVA_TO_BTC]: true,
            [FeatureGates.UNIFIED_BRIDGE_AB_BTC_TO_AVA]: false
          }
        },
        unifiedBridge: {
          pendingTransfers: []
        }
      }

      await initUnifiedBridgeService(
        {},
        {
          ...mockListenerApi,
          getState: () => mockState
        }
      )

      expect(UnifiedBridgeService.init).toHaveBeenCalledWith({
        enabledBridgeTypes: expect.arrayContaining([
          BridgeType.ICTT_ERC20_ERC20,
          BridgeType.AVALANCHE_AVA_BTC
        ]),
        evmSigner: expect.any(Object),
        btcSigner: expect.any(Object),
        bitcoinProvider,
        environment: Environment.PROD
      })
      expect(UnifiedBridgeService.init).not.toHaveBeenCalledWith(
        expect.objectContaining({
          enabledBridgeTypes: expect.arrayContaining([
            BridgeType.CCTP,
            BridgeType.AVALANCHE_EVM,
            BridgeType.AVALANCHE_BTC_AVA
          ])
        })
      )
    })
  })

  describe('checkTransferStatus', () => {
    it('should remove completed transfers', async () => {
      const transfer = { sourceTxHash: '0x123', completedAt: Date.now() }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await checkTransferStatus({ payload: transfer } as any, mockListenerApi)

      expect(mockListenerApi.dispatch).toHaveBeenCalledWith({
        type: 'unifiedBridge/removePendingTransfer',
        payload: '0x123'
      })
    })
  })

  describe('shouldReinitializeBridge', () => {
    it('should detect changes when related feature gates have changed', () => {
      const prevState = {
        settings: {
          advanced: {
            developerMode: false
          }
        },
        posthog: {
          featureFlags: {
            [FeatureGates.UNIFIED_BRIDGE_CCTP]: false,
            [FeatureGates.EVERYTHING]: true
          }
        }
      }
      const currState = {
        settings: {
          advanced: {
            developerMode: false
          }
        },
        posthog: {
          featureFlags: {
            [FeatureGates.UNIFIED_BRIDGE_CCTP]: true,
            [FeatureGates.EVERYTHING]: true
          }
        }
      }

      const result = shouldReinitializeBridge(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        prevState as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        currState as any
      )
      expect(result).toBe(true)
    })

    it('should detect changes when developer mode is toggled', () => {
      const prevState = {
        settings: {
          advanced: {
            developerMode: false
          }
        },
        posthog: {
          featureFlags: {
            [FeatureGates.UNIFIED_BRIDGE_CCTP]: true,
            [FeatureGates.EVERYTHING]: true
          }
        }
      }
      const currState = {
        settings: {
          advanced: {
            developerMode: true
          }
        },
        posthog: {
          featureFlags: {
            [FeatureGates.UNIFIED_BRIDGE_CCTP]: true,
            [FeatureGates.EVERYTHING]: true
          }
        }
      }

      const result = shouldReinitializeBridge(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        prevState as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        currState as any
      )
      expect(result).toBe(true)
    })
  })
})
