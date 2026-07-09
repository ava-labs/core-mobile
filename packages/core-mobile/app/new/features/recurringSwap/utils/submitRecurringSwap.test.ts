import type {
  Chain,
  GasSettings,
  RecurringQuoteResponse
} from '@avalabs/fusion-sdk'

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

// Carries the explicit EIP-1559 override that must reach `executeFirstFill`
// so the SDK fills fees on the batch txs (else the flow falls back to
// sequential per-tx approvals). See buildFusionGasSettings. (CP-14641)
const GAS_SETTINGS: GasSettings = {
  estimateGasMarginBps: 300,
  maxFeePerGas: 25_000_000_000n,
  maxPriorityFeePerGas: 1_500_000_000n
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
  amountPerOrder: 1_000_000n,
  // Keying fields needed for the targeted quote-expiry invalidation.
  fromTokenLocalId: TOKEN_IN.toLowerCase(),
  toTokenLocalId: 'NATIVE-avax',
  fromTokenNetworkChainId: 43114,
  toTokenNetworkChainId: 43114,
  slippageBps: 50,
  gasSettings: GAS_SETTINGS,
  // Default fixture is a software wallet — the only kind that reaches the
  // manual BatchApprovalScreen.
  isBatchSigningSupported: true
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
  })

  it('delegates to markrRecurring.executeFirstFill with quote + fromAddress + sourceChain + signBatch fallback + signerContext', async () => {
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
      // Forwarded verbatim so the SDK's batch path fills maxFeePerGas on the
      // batch txs — without it the batch guard trips and the flow falls back
      // to sequential approvals. (CP-14641)
      gasSettings: GAS_SETTINGS,
      // Software wallet (isBatchSigningSupported: true) → NO fallback. The
      // batch reaches the manual BatchApprovalScreen; a reject/error there must
      // abort, not silently re-prompt as sequential per-tx approvals. CP-14641.
      fallbackToDefaultOnBatchFailure: false,
      // The SDK forwards this verbatim onto `step.signerContext`, where
      // EvmSigner.signOne tags it with the action type derived from
      // `step.currentSignatureReason` (ScheduleRecurringSwap /
      // AllowanceApproval both → 'fill') and attaches it as the approval
      // modal's RECURRING_SWAP context. No `type` field on this payload —
      // the discriminator lives on the SDK's authoritative signature
      // reason, not duplicated by the producer.
      signerContext: {
        fromTokenSymbol: 'USDC',
        toTokenSymbol: 'AVAX',
        amountPerOrderFormatted: expect.stringMatching(/^1(\.0+)?$/),
        // Wire value Markr signs — `RECURRING_UNLIMITED_ORDERS_SENTINEL`
        // (`-1`) for Unlimited or a finite count. "Unlimited?" is derived
        // from this sentinel downstream; no separate boolean field.
        numberOfOrders: QUOTE.numberOfOrders,
        frequency: { unit: 'week', value: 1 }
      }
    })
  })

  // Regression guard for CP-14641: recurring first-fill must forward
  // gasSettings carrying an explicit maxFeePerGas. If this drops, the SDK's
  // one-click batch path leaves the batch txs fee-less, EvmSigner.signBatch's
  // guard throws, and the flow falls back to sequential per-tx approvals
  // instead of opening the BatchApprovalScreen.
  it('forwards gasSettings with an explicit maxFeePerGas to executeFirstFill', async () => {
    mockMarkrRecurring.executeFirstFill.mockResolvedValueOnce({
      txHash: '0xfill'
    })

    await submitRecurringSwap(baseParams)

    const passed = mockMarkrRecurring.executeFirstFill.mock.calls[0]?.[0]
    expect(passed.gasSettings).toEqual(GAS_SETTINGS)
    expect(typeof passed.gasSettings.maxFeePerGas).toBe('bigint')
  })

  // CP-14641: a batch reject on a software wallet must abort, not fall back to
  // sequential per-tx approvals. The SDK's blanket fallback catch can't tell a
  // user rejection from a real failure, so software wallets disable it.
  it('disables fallbackToDefaultOnBatchFailure for software wallets (batch reject aborts)', async () => {
    mockMarkrRecurring.executeFirstFill.mockResolvedValueOnce({
      txHash: '0xfill'
    })

    await submitRecurringSwap({ ...baseParams, isBatchSigningSupported: true })

    expect(mockMarkrRecurring.executeFirstFill).toHaveBeenCalledWith(
      expect.objectContaining({ fallbackToDefaultOnBatchFailure: false })
    )
  })

  // Hardware / WalletConnect never reach the batch screen (signBatch throws
  // BatchSigningUnsupportedError first), so they still need the fallback to
  // complete the swap one tx at a time.
  it('enables fallbackToDefaultOnBatchFailure for hardware / WalletConnect wallets', async () => {
    mockMarkrRecurring.executeFirstFill.mockResolvedValueOnce({
      txHash: '0xfill'
    })

    await submitRecurringSwap({ ...baseParams, isBatchSigningSupported: false })

    expect(mockMarkrRecurring.executeFirstFill).toHaveBeenCalledWith(
      expect.objectContaining({ fallbackToDefaultOnBatchFailure: true })
    )
  })

  it('fires RecurringSwapScheduled analytics + success snackbar after executeFirstFill resolves', async () => {
    mockMarkrRecurring.executeFirstFill.mockResolvedValueOnce({
      txHash: '0xfill'
    })

    await submitRecurringSwap(baseParams)

    expect(mockCapture).toHaveBeenCalledWith('RecurringSwapScheduled', {
      chainId: QUOTE.chainId,
      encrypted: {
        scheduleUuid: QUOTE.uuid,
        fromTokenSymbol: 'USDC',
        toTokenSymbol: 'AVAX',
        amountPerOrder: '1000000',
        numberOfOrders: QUOTE.numberOfOrders,
        intervalSeconds: 604_800
      }
    })
    expect(mockSnackbar).toHaveBeenCalledWith('Recurring swap scheduled')
    // Immediate cache invalidation at broadcast — staggered follow-ups
    // happen via setTimeout, not asserted here.
    expect(mockInvalidateQueries).toHaveBeenCalled()
  })

  // End-to-end "real unlimited" path: the user picked Unlimited and the
  // fusion-sdk quote normalizer echoes back the wire sentinel (-1) on the
  // response. Analytics + signerContext both forward the sentinel
  // verbatim — downstream consumers derive "unlimited?" from
  // `numberOfOrders === -1`, no separate boolean.
  it('passes wire-sentinel numberOfOrders=-1 through to analytics + signerContext for unlimited quotes', async () => {
    mockMarkrRecurring.executeFirstFill.mockResolvedValueOnce({
      txHash: '0xfill'
    })

    const UNLIMITED_QUOTE: RecurringQuoteResponse = {
      ...QUOTE,
      numberOfOrders: -1
    }

    await submitRecurringSwap({
      ...baseParams,
      quote: UNLIMITED_QUOTE,
      numberOfOrders: UNLIMITED_ORDERS
    })

    expect(mockCapture).toHaveBeenCalledWith('RecurringSwapScheduled', {
      chainId: UNLIMITED_QUOTE.chainId,
      encrypted: {
        scheduleUuid: UNLIMITED_QUOTE.uuid,
        fromTokenSymbol: 'USDC',
        toTokenSymbol: 'AVAX',
        amountPerOrder: '1000000',
        numberOfOrders: -1,
        intervalSeconds: 604_800
      }
    })
    expect(mockMarkrRecurring.executeFirstFill).toHaveBeenCalledWith(
      expect.objectContaining({
        signerContext: expect.objectContaining({
          numberOfOrders: -1
        })
      })
    )
  })

  // Mismatched-quote guard: if a stale/mismatched quote slips through where
  // the caller asked for Unlimited but `quote.numberOfOrders` is finite,
  // the signed wire value wins — what's about to be submitted is what
  // gets previewed. The forwarded `numberOfOrders` mirrors the quote, not
  // the UI sentinel.
  it('anchors numberOfOrders on the quote wire value when UI param and quote disagree', async () => {
    mockMarkrRecurring.executeFirstFill.mockResolvedValueOnce({
      txHash: '0xfill'
    })

    await submitRecurringSwap({
      ...baseParams,
      // QUOTE.numberOfOrders is 4 (finite) — UI param disagrees.
      numberOfOrders: UNLIMITED_ORDERS
    })

    expect(mockCapture).toHaveBeenCalledWith(
      'RecurringSwapScheduled',
      expect.objectContaining({
        encrypted: expect.objectContaining({
          numberOfOrders: QUOTE.numberOfOrders
        })
      })
    )
    expect(mockMarkrRecurring.executeFirstFill).toHaveBeenCalledWith(
      expect.objectContaining({
        signerContext: expect.objectContaining({
          numberOfOrders: QUOTE.numberOfOrders
        })
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

  // Regression: previously the quote-expiry path invalidated by the bare
  // `[RECURRING_QUOTE]` prefix, nuking every cached recurring quote in the
  // app. The expiry invalidation must now be `exact`-keyed to the specific
  // (pair, amount, orders, frequency, slippage) tuple that just expired.
  it('invalidates only the expired quote (exact key) on pre-flight QUOTE_EXPIRED', async () => {
    const EXPIRED_QUOTE: RecurringQuoteResponse = {
      ...QUOTE,
      expiredAt: Math.floor(Date.now() / 1000) - 1
    }

    await expect(
      submitRecurringSwap({ ...baseParams, quote: EXPIRED_QUOTE })
    ).rejects.toThrow('QUOTE_EXPIRED')

    expect(mockInvalidateQueries).toHaveBeenCalledTimes(1)
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: [
        'recurringQuote',
        43114,
        TOKEN_IN.toLowerCase(),
        43114,
        'NATIVE-avax',
        '1000000',
        '4',
        'week',
        1,
        50
      ],
      exact: true
    })
  })
})
