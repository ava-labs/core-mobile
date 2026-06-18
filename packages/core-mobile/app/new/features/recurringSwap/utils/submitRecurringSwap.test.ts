import type { Chain, RecurringQuoteResponse } from '@avalabs/fusion-sdk'

// ─── Module mocks ─────────────────────────────────────────────────────────────

const mockMarkrRecurring = {
  executeFirstFill: jest.fn(),
  quote: jest.fn(),
  listOrders: jest.fn(),
  executeCancellation: jest.fn(),
  executePause: jest.fn(),
  executeUnpause: jest.fn(),
  checkEligibility: jest.fn(),
  getRecurringChainInfo: jest.fn()
}
jest.mock('features/swap/services/FusionService', () => ({
  __esModule: true,
  default: {
    get markrRecurring() {
      return mockMarkrRecurring
    }
  }
}))

const mockCapture = jest.fn()
jest.mock('services/analytics/AnalyticsService', () => ({
  __esModule: true,
  default: { capture: (...args: unknown[]) => mockCapture(...args) }
}))

const mockSnackbar = jest.fn()
jest.mock('common/utils/toast', () => ({
  showSnackbar: (...args: unknown[]) => mockSnackbar(...args)
}))

const mockInvalidateQueries = jest.fn()
jest.mock('contexts/ReactQueryProvider', () => ({
  queryClient: {
    invalidateQueries: (...args: unknown[]) => mockInvalidateQueries(...args)
  }
}))

const mockSetActive = jest.fn()
const mockClearActive = jest.fn()
jest.mock('../services/activeActionContext', () => ({
  setActiveRecurringActionContext: (...args: unknown[]) =>
    mockSetActive(...args),
  clearActiveRecurringActionContext: (...args: unknown[]) =>
    mockClearActive(...args)
}))

import { UNLIMITED_ORDERS } from '../types'
import { submitRecurringSwap } from './submitRecurringSwap'

// ─── Test fixtures ────────────────────────────────────────────────────────────

const FROM_ADDR = '0x0000000000000000000000000000000000000002'
const TOKEN_IN = '0x0000000000000000000000000000000000000003'
const TOKEN_OUT = '0x0000000000000000000000000000000000000004'

const SOURCE_CHAIN = {
  chainId: 'eip155:43114',
  chainName: 'Avalanche C-Chain',
  rpcUrl: 'https://api.avax.network/ext/bc/C/rpc'
} as unknown as Chain

const QUOTE: RecurringQuoteResponse = {
  uuid: 'deadbeef-1234-5678-9abc-def012345678',
  chainId: 43114,
  tokenIn: TOKEN_IN as `0x${string}`,
  tokenOut: TOKEN_OUT as `0x${string}`,
  amount: 1_000_000n,
  numberOfOrders: 4,
  frequency: { unit: 'week', value: 1 },
  intervalSeconds: 604_800,
  totalAmountIn: 4_000_000n,
  amountOut: 9_000_000n,
  minAmountOut: 8_900_000n,
  fees: [],
  recommendedSlippage: 50,
  expiredAt: Math.floor(Date.now() / 1000) + 300
}

const baseParams = {
  quote: QUOTE,
  fromAddress: FROM_ADDR,
  sourceChain: SOURCE_CHAIN,
  fromTokenSymbol: 'USDC',
  fromTokenDecimals: 6,
  toTokenSymbol: 'AVAX',
  frequency: { unit: 'week', value: 1 } as const,
  numberOfOrders: 4,
  amountPerOrder: 1_000_000n
}

describe('submitRecurringSwap', () => {
  beforeEach(() => {
    Object.values(mockMarkrRecurring).forEach(fn => {
      if (typeof fn === 'function' && 'mockReset' in fn) {
        ;(fn as jest.Mock).mockReset()
      }
    })
    mockCapture.mockReset()
    mockSnackbar.mockReset()
    mockInvalidateQueries.mockReset()
    mockSetActive.mockReset()
  })

  it('delegates to markrRecurring.executeFirstFill with quote + fromAddress + sourceChain + signBatch fallback', async () => {
    mockMarkrRecurring.executeFirstFill.mockResolvedValueOnce({
      txHash: '0xfill'
    })

    const result = await submitRecurringSwap(baseParams)

    expect(result).toEqual({ txHash: '0xfill' })
    expect(mockMarkrRecurring.executeFirstFill).toHaveBeenCalledTimes(1)
    expect(mockMarkrRecurring.executeFirstFill).toHaveBeenCalledWith({
      quote: QUOTE,
      fromAddress: FROM_ADDR,
      sourceChain: SOURCE_CHAIN,
      // Match `transferAsset`'s graceful one-click → sequential fallback.
      fallbackToDefaultOnBatchFailure: true
    })
  })

  it('fires RecurringSwapScheduled analytics + success snackbar after executeFirstFill resolves', async () => {
    mockMarkrRecurring.executeFirstFill.mockResolvedValueOnce({
      txHash: '0xfill'
    })

    await submitRecurringSwap(baseParams)

    expect(mockCapture).toHaveBeenCalledWith('RecurringSwapScheduled', {
      encrypted: {
        scheduleUuid: QUOTE.uuid,
        chainId: QUOTE.chainId,
        fromTokenSymbol: 'USDC',
        toTokenSymbol: 'AVAX',
        amountPerOrder: '1000000',
        numberOfOrders: QUOTE.numberOfOrders,
        isUnlimited: false,
        intervalSeconds: 604_800
      }
    })
    expect(mockSnackbar).toHaveBeenCalledWith('Recurring swap scheduled')
    // Immediate cache invalidation at broadcast — staggered follow-ups
    // happen via setTimeout, not asserted here.
    expect(mockInvalidateQueries).toHaveBeenCalled()
  })

  it('populates the recurring-action side channel with the fill snapshot before invoking the SDK', async () => {
    mockMarkrRecurring.executeFirstFill.mockResolvedValueOnce({
      txHash: '0xfill'
    })

    await submitRecurringSwap(baseParams)

    expect(mockSetActive).toHaveBeenCalledWith({
      type: 'fill',
      fromTokenSymbol: 'USDC',
      toTokenSymbol: 'AVAX',
      // 1_000_000 with 6 decimals → "1". formatTokenAmount may add
      // trailing zeros depending on impl; use a regex to stay tolerant.
      amountPerOrderFormatted: expect.stringMatching(/^1(\.0+)?$/),
      numberOfOrders: QUOTE.numberOfOrders,
      isUnlimited: false,
      frequency: { unit: 'week', value: 1 }
    })
    // No finally-clear assertion here: `submitRecurringSwap` clears the slot in
    // its `finally` after the SDK call settles; this test only asserts the
    // pre-call snapshot is set correctly.
  })

  it('marks isUnlimited=true in analytics when numberOfOrders is UNLIMITED_ORDERS', async () => {
    mockMarkrRecurring.executeFirstFill.mockResolvedValueOnce({
      txHash: '0xfill'
    })

    await submitRecurringSwap({
      ...baseParams,
      numberOfOrders: UNLIMITED_ORDERS
    })

    expect(mockCapture).toHaveBeenCalledWith(
      'RecurringSwapScheduled',
      expect.objectContaining({
        encrypted: expect.objectContaining({ isUnlimited: true })
      })
    )
  })

  it('throws when markrRecurring is not available', async () => {
    // Hard-mock the getter to return undefined for this case.
    const FusionService =
      require('features/swap/services/FusionService').default
    const orig = Object.getOwnPropertyDescriptor(
      FusionService,
      'markrRecurring'
    )
    Object.defineProperty(FusionService, 'markrRecurring', {
      configurable: true,
      get: () => undefined
    })

    await expect(submitRecurringSwap(baseParams)).rejects.toThrow(
      'markrRecurring namespace not available'
    )

    // Restore.
    if (orig) Object.defineProperty(FusionService, 'markrRecurring', orig)
  })

  it('does NOT fire analytics or snackbar when executeFirstFill rejects', async () => {
    mockMarkrRecurring.executeFirstFill.mockRejectedValueOnce(
      new Error('user rejected')
    )

    await expect(submitRecurringSwap(baseParams)).rejects.toThrow(
      'user rejected'
    )

    expect(mockCapture).not.toHaveBeenCalled()
    expect(mockSnackbar).not.toHaveBeenCalled()
    expect(mockInvalidateQueries).not.toHaveBeenCalled()
  })
})
