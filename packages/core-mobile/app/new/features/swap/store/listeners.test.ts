/* eslint-disable @typescript-eslint/no-explicit-any */

import { selectIsLocked } from 'store/app/slice'
import { selectIsDeveloperMode } from 'store/settings/advanced/slice'
import {
  selectIsFusionEnabled,
  selectIsFusionMarkrEnabled,
  selectIsFusionAvalancheEvmEnabled,
  selectIsFusionLombardBtcToBtcbEnabled,
  selectIsFusionLombardBtcbToBtcEnabled,
  selectFusionDisableCrossChainSwaps
} from 'store/posthog/slice'
import Logger from 'utils/Logger'
import AnalyticsService from 'services/analytics/AnalyticsService'
import FusionService from '../services/FusionService'
import {
  useIsFusionServiceReady,
  useFusionServiceInitError,
  updateFusionTransfer,
  getPendingFusionTransfers
} from '../hooks/useZustandStore'
import {
  initFusionService,
  cleanupFusionService,
  addFusionListeners,
  createCaptureSwapAnalytics
} from './listeners'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('store/app/slice', () => ({
  selectIsLocked: jest.fn(),
  onAppUnlocked: { type: 'app/onAppUnlocked' },
  onLogOut: { type: 'app/onLogOut' }
}))

jest.mock('store/settings/advanced/slice', () => ({
  selectIsDeveloperMode: jest.fn(),
  toggleDeveloperMode: { type: 'settings/toggleDeveloperMode' }
}))

jest.mock('store/posthog/slice', () => ({
  selectIsFusionEnabled: jest.fn(),
  selectIsFusionMarkrEnabled: jest.fn(),
  selectIsFusionAvalancheEvmEnabled: jest.fn(),
  selectIsFusionLombardBtcToBtcbEnabled: jest.fn(),
  selectIsFusionLombardBtcbToBtcEnabled: jest.fn(),
  selectFusionDisableCrossChainSwaps: jest.fn(),
  setFeatureFlags: { type: 'posthog/setFeatureFlags' }
}))

jest.mock('utils/Logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}))

jest.mock('services/analytics/AnalyticsService', () => ({
  __esModule: true,
  default: { capture: jest.fn() }
}))

jest.mock('store/rpc/utils/createInAppRequest', () => ({
  createInAppRequest: jest.fn().mockReturnValue({})
}))

jest.mock('services/network/utils/providerUtils', () => ({
  getBitcoinProvider: jest.fn().mockResolvedValue({})
}))

jest.mock('../services/FusionService', () => ({
  __esModule: true,
  default: {
    initWithFeatureFlags: jest.fn(),
    cleanup: jest.fn(),
    trackTransfer: jest.fn()
  }
}))

jest.mock('../consts', () => ({
  getFusionEnvironment: jest.fn().mockReturnValue('PROD')
}))

jest.mock('../services/signers/EvmSigner', () => ({
  createEvmSigner: jest.fn().mockReturnValue({})
}))

jest.mock('../services/signers/BtcSigner', () => ({
  createBtcSigner: jest.fn().mockReturnValue({})
}))

jest.mock('../hooks/useZustandStore', () => ({
  useIsFusionServiceReady: {
    getState: jest.fn(),
    setState: jest.fn()
  },
  useFusionServiceInitError: {
    getState: jest.fn(),
    setState: jest.fn()
  },
  updateFusionTransfer: jest.fn(),
  getPendingFusionTransfers: jest.fn()
}))

jest.mock('../utils/fetchAdapter', () => ({
  fetchAdapter: jest.fn()
}))

jest.mock('./actions', () => ({
  trackFusionTransfer: { type: 'fusion/trackTransfer' }
}))

// ---------------------------------------------------------------------------
// Typed references to mocks
// ---------------------------------------------------------------------------

const mockSelectIsLocked = selectIsLocked as jest.Mock
const mockSelectIsDeveloperMode = selectIsDeveloperMode as jest.Mock
const mockSelectIsFusionEnabled = selectIsFusionEnabled as jest.Mock
const mockSelectIsFusionMarkrEnabled = selectIsFusionMarkrEnabled as jest.Mock
const mockSelectIsFusionAvalancheEvmEnabled =
  selectIsFusionAvalancheEvmEnabled as jest.Mock
const mockSelectIsFusionLombardBtcToBtcbEnabled =
  selectIsFusionLombardBtcToBtcbEnabled as jest.Mock
const mockSelectIsFusionLombardBtcbToBtcEnabled =
  selectIsFusionLombardBtcbToBtcEnabled as jest.Mock
const mockSelectFusionDisableCrossChainSwaps =
  selectFusionDisableCrossChainSwaps as jest.Mock
const mockGetPendingFusionTransfers = getPendingFusionTransfers as jest.Mock
const mockUseIsFusionServiceReady = useIsFusionServiceReady as any
const mockUseFusionServiceInitError = useFusionServiceInitError as any

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeListenerApi = (overrides: Partial<any> = {}): any => ({
  getState: jest.fn().mockReturnValue({}),
  getOriginalState: jest.fn().mockReturnValue({}),
  dispatch: jest.fn(),
  ...overrides
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Fusion listeners', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Defaults: unlocked, Fusion enabled, all feature flags off, not dev mode
    mockSelectIsLocked.mockReturnValue(false)
    mockSelectIsDeveloperMode.mockReturnValue(false)
    mockSelectIsFusionEnabled.mockReturnValue(true)
    mockSelectIsFusionMarkrEnabled.mockReturnValue(false)
    mockSelectIsFusionAvalancheEvmEnabled.mockReturnValue(false)
    mockSelectIsFusionLombardBtcToBtcbEnabled.mockReturnValue(false)
    mockSelectIsFusionLombardBtcbToBtcEnabled.mockReturnValue(false)
    mockSelectFusionDisableCrossChainSwaps.mockReturnValue(false)

    mockUseIsFusionServiceReady.getState.mockReturnValue(false)
    mockGetPendingFusionTransfers.mockReturnValue([])
    ;(FusionService.initWithFeatureFlags as jest.Mock).mockResolvedValue(
      undefined
    )
  })

  // -------------------------------------------------------------------------
  describe('initFusionService', () => {
    it('should skip initialization when app is locked', async () => {
      mockSelectIsLocked.mockReturnValue(true)

      await initFusionService({}, makeListenerApi())

      expect(FusionService.initWithFeatureFlags).not.toHaveBeenCalled()
      expect(Logger.info).toHaveBeenCalledWith(
        'App is locked, skipping Fusion service initialization'
      )
    })

    it('should skip initialization when Fusion is disabled', async () => {
      mockSelectIsFusionEnabled.mockReturnValue(false)

      await initFusionService({}, makeListenerApi())

      expect(FusionService.initWithFeatureFlags).not.toHaveBeenCalled()
      expect(Logger.info).toHaveBeenCalledWith(
        'Fusion is disabled, skipping initialization'
      )
      expect(mockUseIsFusionServiceReady.setState).toHaveBeenCalledWith(false)
    })

    it('should initialize and mark service ready on success', async () => {
      await initFusionService({}, makeListenerApi())

      expect(FusionService.initWithFeatureFlags).toHaveBeenCalled()
      expect(mockUseIsFusionServiceReady.setState).toHaveBeenCalledWith(true)
    })

    it('should pass the correct feature flags to initWithFeatureFlags', async () => {
      mockSelectIsFusionMarkrEnabled.mockReturnValue(true)
      mockSelectIsFusionAvalancheEvmEnabled.mockReturnValue(true)

      await initFusionService({}, makeListenerApi())

      expect(FusionService.initWithFeatureFlags).toHaveBeenCalledWith(
        expect.objectContaining({
          featureFlags: {
            'fusion-markr': true,
            'fusion-avalanche-evm': true,
            'fusion-lombard-btc-to-btcb': false,
            'fusion-lombard-btcb-to-btc': false,
            'fusion-disable-cross-chain-swaps': false
          }
        })
      )
    })

    it('should pass fusion-disable-cross-chain-swaps=true when flag is enabled', async () => {
      mockSelectFusionDisableCrossChainSwaps.mockReturnValue(true)

      await initFusionService({}, makeListenerApi())

      expect(FusionService.initWithFeatureFlags).toHaveBeenCalledWith(
        expect.objectContaining({
          featureFlags: expect.objectContaining({
            'fusion-disable-cross-chain-swaps': true
          })
        })
      )
    })

    it('should mark service as not ready and log error when init fails', async () => {
      const error = new Error('SDK init failed')
      ;(FusionService.initWithFeatureFlags as jest.Mock).mockRejectedValue(
        error
      )

      await initFusionService({}, makeListenerApi())

      expect(mockUseIsFusionServiceReady.setState).toHaveBeenCalledWith(false)
      expect(Logger.error).toHaveBeenCalledWith(
        '[initFusionService listener] Failed to initialize Fusion service',
        error
      )
    })

    describe('when service is already initialized', () => {
      beforeEach(() => {
        mockUseIsFusionServiceReady.getState.mockReturnValue(true)
      })

      it('should skip reinit when no relevant state has changed', async () => {
        // All selectors return the same value for both prevState and currentState
        // → shouldReinitializeFusion returns false → early return

        await initFusionService({}, makeListenerApi())

        expect(FusionService.cleanup).not.toHaveBeenCalled()
        expect(FusionService.initWithFeatureFlags).not.toHaveBeenCalled()
      })

      it('should cleanup and reinit when a relevant feature flag changes', async () => {
        // markr: prevState=false (first call), currentState=true (subsequent calls)
        mockSelectIsFusionMarkrEnabled
          .mockReturnValueOnce(false)
          .mockReturnValue(true)

        await initFusionService({}, makeListenerApi())

        expect(FusionService.cleanup).toHaveBeenCalled()
        expect(FusionService.initWithFeatureFlags).toHaveBeenCalled()
      })

      it('should cleanup and reinit when fusion-disable-cross-chain-swaps changes', async () => {
        mockSelectFusionDisableCrossChainSwaps
          .mockReturnValueOnce(false)
          .mockReturnValue(true)

        await initFusionService({}, makeListenerApi())

        expect(FusionService.cleanup).toHaveBeenCalled()
        expect(FusionService.initWithFeatureFlags).toHaveBeenCalled()
      })

      it('should cleanup and reinit when developer mode changes', async () => {
        // devMode: prevState=false (first call), currentState=true
        mockSelectIsDeveloperMode
          .mockReturnValueOnce(false)
          .mockReturnValue(true)

        await initFusionService({}, makeListenerApi())

        expect(FusionService.cleanup).toHaveBeenCalled()
        expect(FusionService.initWithFeatureFlags).toHaveBeenCalled()
      })
    })
  })

  // -------------------------------------------------------------------------
  describe('cleanupFusionService', () => {
    it('should call FusionService.cleanup', async () => {
      await cleanupFusionService({}, {} as any)

      expect(FusionService.cleanup).toHaveBeenCalled()
    })

    it('should mark service as not ready', async () => {
      await cleanupFusionService({}, {} as any)

      expect(mockUseIsFusionServiceReady.setState).toHaveBeenCalledWith(false)
    })

    it('should clear the init error', async () => {
      await cleanupFusionService({}, {} as any)

      expect(mockUseFusionServiceInitError.setState).toHaveBeenCalledWith(null)
    })
  })

  // -------------------------------------------------------------------------
  describe('Fusion init error state', () => {
    it('should clear the init error before starting initialization', async () => {
      await initFusionService({}, makeListenerApi())

      expect(mockUseFusionServiceInitError.setState).toHaveBeenCalledWith(null)
    })

    it('should clear the init error when Fusion is disabled', async () => {
      mockSelectIsFusionEnabled.mockReturnValue(false)

      await initFusionService({}, makeListenerApi())

      expect(mockUseFusionServiceInitError.setState).toHaveBeenCalledWith(null)
    })

    it('should not set an init error on successful initialization', async () => {
      await initFusionService({}, makeListenerApi())

      // Only the "clear" call — no error instance is ever passed in the success path
      const calls = mockUseFusionServiceInitError.setState.mock.calls
      expect(calls.every((args: unknown[]) => args[0] === null)).toBe(true)
    })

    it('should set the init error when initialization throws an Error', async () => {
      const error = new Error('SDK init failed')
      ;(FusionService.initWithFeatureFlags as jest.Mock).mockRejectedValue(
        error
      )

      await initFusionService({}, makeListenerApi())

      expect(mockUseFusionServiceInitError.setState).toHaveBeenCalledWith(error)
    })

    it('should coerce a non-Error throw value into an Error instance', async () => {
      ;(FusionService.initWithFeatureFlags as jest.Mock).mockRejectedValue(
        'boom'
      )

      await initFusionService({}, makeListenerApi())

      const errorCall = mockUseFusionServiceInitError.setState.mock.calls.find(
        (args: unknown[]) => args[0] instanceof Error
      )
      expect(errorCall).toBeDefined()
      expect(errorCall[0]).toBeInstanceOf(Error)
      expect(errorCall[0].message).toBe('boom')
    })
  })

  // -------------------------------------------------------------------------
  describe('resumeTransfersTracking (via initFusionService)', () => {
    it('should call trackTransfer for each pending transfer after init', async () => {
      const transfer1 = { id: 'transfer-1', status: 'source-pending' } as any
      const transfer2 = { id: 'transfer-2', status: 'target-pending' } as any
      mockGetPendingFusionTransfers.mockReturnValue([
        { transfer: transfer1 },
        { transfer: transfer2 }
      ])

      await initFusionService({}, makeListenerApi())

      expect(FusionService.trackTransfer).toHaveBeenCalledTimes(2)
      expect(FusionService.trackTransfer).toHaveBeenCalledWith(
        transfer1,
        updateFusionTransfer,
        expect.any(Function)
      )
      expect(FusionService.trackTransfer).toHaveBeenCalledWith(
        transfer2,
        updateFusionTransfer,
        expect.any(Function)
      )
    })

    it('should not call trackTransfer when there are no pending transfers', async () => {
      mockGetPendingFusionTransfers.mockReturnValue([])

      await initFusionService({}, makeListenerApi())

      expect(FusionService.trackTransfer).not.toHaveBeenCalled()
    })

    it('should log error and not throw when getPendingFusionTransfers throws', async () => {
      const error = new Error('store error')
      mockGetPendingFusionTransfers.mockImplementation(() => {
        throw error
      })

      await expect(
        initFusionService({}, makeListenerApi())
      ).resolves.not.toThrow()
      expect(Logger.error).toHaveBeenCalledWith(
        '[FusionTracking] failed to resume transfer tracking',
        error
      )
    })
  })

  // -------------------------------------------------------------------------
  describe('addFusionListeners', () => {
    it('should register initFusionService for onAppUnlocked, toggleDeveloperMode, setFeatureFlags', () => {
      const startListening = jest.fn()

      addFusionListeners(startListening as any)

      expect(startListening).toHaveBeenCalledWith(
        expect.objectContaining({
          matcher: expect.any(Function),
          effect: initFusionService
        })
      )
    })

    it('should register cleanupFusionService for onLogOut', () => {
      const startListening = jest.fn()

      addFusionListeners(startListening as any)

      expect(startListening).toHaveBeenCalledWith(
        expect.objectContaining({
          actionCreator: expect.objectContaining({ type: 'app/onLogOut' }),
          effect: cleanupFusionService
        })
      )
    })

    it('should register a listener for trackFusionTransfer', () => {
      const startListening = jest.fn()

      addFusionListeners(startListening as any)

      expect(startListening).toHaveBeenCalledWith(
        expect.objectContaining({
          actionCreator: expect.objectContaining({
            type: 'fusion/trackTransfer'
          }),
          effect: expect.any(Function)
        })
      )
    })

    it('should call trackTransfer after a 2s delay when trackFusionTransfer is dispatched', async () => {
      jest.useFakeTimers()
      const startListening = jest.fn()
      addFusionListeners(startListening as any)

      // Extract the effect registered for trackFusionTransfer
      const call = startListening.mock.calls.find(
        c => c[0]?.actionCreator?.type === 'fusion/trackTransfer'
      )
      const effect = call[0].effect
      const transfer = { id: 'transfer-1', status: 'source-pending' } as any
      const payload = {
        transfer,
        quote: { aggregator: { id: 'agg-1', name: 'KyberSwap' } } as any,
        userClickedMax: false
      }

      const mockListenerApi = {
        getState: jest.fn().mockReturnValue({}),
        delay: (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
      }
      const effectPromise = effect({ payload }, mockListenerApi)

      // trackTransfer should not be called immediately
      expect(FusionService.trackTransfer).not.toHaveBeenCalled()

      jest.advanceTimersByTime(2000)
      await effectPromise

      expect(FusionService.trackTransfer).toHaveBeenCalledWith(
        transfer,
        updateFusionTransfer,
        expect.any(Function)
      )

      jest.useRealTimers()
    })

    it('should return early and not call trackTransfer when selectIsFusionEnabled returns false', async () => {
      mockSelectIsFusionEnabled.mockReturnValue(false)

      const startListening = jest.fn()
      addFusionListeners(startListening as any)

      // Extract the effect registered for trackFusionTransfer
      const call = startListening.mock.calls.find(
        c => c[0]?.actionCreator?.type === 'fusion/trackTransfer'
      )
      const effect = call[0].effect
      const payload = {
        transfer: { id: 'transfer-1', status: 'source-pending' } as any,
        quote: { aggregator: { id: 'agg-1', name: 'KyberSwap' } } as any,
        userClickedMax: false
      }

      const mockListenerApi = {
        getState: jest.fn().mockReturnValue({}),
        delay: jest.fn()
      }

      await effect({ payload }, mockListenerApi)

      expect(FusionService.trackTransfer).not.toHaveBeenCalled()
      expect(mockListenerApi.delay).not.toHaveBeenCalled()
    })
  })

  // -------------------------------------------------------------------------
  describe('createCaptureSwapAnalytics — SwapFailed instrumentation (CP-14225)', () => {
    const baseFailedTransfer = {
      status: 'failed',
      fromAddress: '0xfromAddress',
      toAddress: '0xtoAddress',
      sourceChain: { chainId: 'eip155:43114' },
      targetChain: { chainId: 'eip155:43114' },
      source: { txHash: '0xsourceHash' },
      target: undefined,
      errorCode: 5006,
      errorReason: 'TRANSACTION_REVERTED'
    } as any

    const baseQuote = {
      aggregator: { id: 'agg-markr-odos', name: 'Odos' },
      amountIn: 1290000000000000000n
    } as any

    it('captures all 7 new fields on SwapFailed when userClickedMax is true', () => {
      const capture = createCaptureSwapAnalytics({
        quote: baseQuote,
        userClickedMax: true,
        sourceTokenAddress: undefined,
        sourceTokenSymbol: 'AVAX',
        destinationTokenAddress: '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e',
        destinationTokenSymbol: 'USDC'
      })

      capture(baseFailedTransfer)

      expect(AnalyticsService.capture).toHaveBeenCalledWith(
        'SwapFailed',
        expect.objectContaining({
          encrypted: expect.objectContaining({
            sourceAddress: '0xfromAddress',
            targetAddress: '0xtoAddress',
            sourceChainId: 'eip155:43114',
            targetChainId: 'eip155:43114',
            sourceTxHash: '0xsourceHash',
            errorCode: '5006',
            errorReason: 'TRANSACTION_REVERTED',
            userClickedMax: true,
            sourceTokenSymbol: 'AVAX',
            sourceTokenAddress: undefined,
            sourceAmount: '1290000000000000000',
            destinationTokenAddress:
              '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e',
            destinationTokenSymbol: 'USDC',
            quoteAggregator: 'Odos',
            quoteAggregatorId: 'agg-markr-odos'
          })
        })
      )
    })

    it('captures userClickedMax=false on SwapFailed when the user did not press Max', () => {
      const capture = createCaptureSwapAnalytics({
        quote: baseQuote,
        userClickedMax: false,
        sourceTokenAddress: '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e',
        sourceTokenSymbol: 'USDC',
        destinationTokenAddress: undefined,
        destinationTokenSymbol: 'AVAX'
      })

      capture(baseFailedTransfer)

      expect(AnalyticsService.capture).toHaveBeenCalledWith(
        'SwapFailed',
        expect.objectContaining({
          encrypted: expect.objectContaining({
            userClickedMax: false,
            sourceTokenSymbol: 'USDC',
            destinationTokenSymbol: 'AVAX',
            quoteAggregator: 'Odos'
          })
        })
      )
    })

    it('does not enrich SwapSuccessful with the new fields', () => {
      const completed = {
        ...baseFailedTransfer,
        status: 'completed',
        source: { txHash: '0xsourceHash' },
        target: { txHash: '0xtargetHash' }
      } as any

      const capture = createCaptureSwapAnalytics({
        quote: baseQuote,
        userClickedMax: true,
        sourceTokenSymbol: 'AVAX',
        destinationTokenSymbol: 'USDC'
      })

      capture(completed)

      expect(AnalyticsService.capture).toHaveBeenCalledWith(
        'SwapSuccessful',
        expect.objectContaining({
          encrypted: expect.not.objectContaining({
            userClickedMax: expect.anything(),
            quoteAggregator: expect.anything()
          })
        })
      )
    })
  })
})
