import { RpcMethod } from '@avalabs/vm-module-types'
import { RequestContext } from 'store/rpc/types'

// ─── Module mocks ─────────────────────────────────────────────────────────────

jest.mock('utils/caip2ChainIds', () => ({
  getEvmCaip2ChainId: (n: number) => `eip155:${n}`
}))

jest.mock('../services/AllowanceService', () => ({
  fetchRouterAddress: jest.fn(),
  readErc20Allowance: jest.fn()
}))

jest.mock('../services/RecurringSwapService.singleton', () => ({
  getRecurringSwapService: jest.fn()
}))

import {
  fetchRouterAddress,
  readErc20Allowance
} from '../services/AllowanceService'
import { getRecurringSwapService } from '../services/RecurringSwapService.singleton'
import { submitRecurringSwap } from './submitRecurringSwap'

// ─── Test fixtures ────────────────────────────────────────────────────────────

// Lowercase addresses are accepted by ethers (EIP-55 checksum is only enforced
// when mixed-case is supplied). Using the well-known all-lowercase form here.
const ROUTER = '0x0000000000000000000000000000000000000001'
const FROM_ADDR = '0x0000000000000000000000000000000000000002'
const TOKEN_IN = '0x0000000000000000000000000000000000000003'
const TOKEN_OUT = '0x0000000000000000000000000000000000000004'
const FILL_ADDR = '0x0000000000000000000000000000000000000005'
const FILL_TX = {
  from: FROM_ADDR,
  to: FILL_ADDR,
  data: '0xdeadbeef',
  value: '0x0'
}

const makeQuote = (overrides: Record<string, unknown> = {}) => ({
  uuid: 'test-uuid',
  appId: 'test-app-id',
  chainId: 43114,
  tokenIn: TOKEN_IN.toLowerCase(),
  tokenOut: TOKEN_OUT.toLowerCase(),
  amount: '1000000',
  numberOfOrders: 4,
  frequency: { unit: 'day' as const, value: 1 },
  totalAmountIn: '4000000',
  fees: [],
  recommendedSlippage: 50,
  expiredAt: 9999999999,
  ...overrides
})

const makeParams = (overrides: Record<string, unknown> = {}) => ({
  request: jest.fn().mockResolvedValue('0xtxhash'),
  quote: makeQuote(),
  activeAccount: { addressC: FROM_ADDR },
  fromToken: {
    address: TOKEN_IN,
    symbol: 'USDC',
    decimals: 6,
    networkChainId: 43114
  },
  toToken: {
    address: TOKEN_OUT,
    symbol: 'AVAX',
    decimals: 18,
    networkChainId: 43114
  },
  frequency: { unit: 'day' as const, value: 1 },
  numberOfOrders: 4,
  amountPerOrder: 1_000_000n,
  slippageBps: 50,
  // Allow caller to override top-level fields; nested objects need full replacement.
  ...overrides
})

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks()
  ;(fetchRouterAddress as jest.Mock).mockResolvedValue(ROUTER)
  ;(getRecurringSwapService as jest.Mock).mockReturnValue({
    recurringSwap: jest.fn().mockResolvedValue(FILL_TX)
  })
})

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('submitRecurringSwap', () => {
  describe('when allowance < totalAmountIn', () => {
    beforeEach(() => {
      ;(readErc20Allowance as jest.Mock).mockResolvedValue(0n)
    })

    it('dispatches approve then fill — two request() calls total', async () => {
      const params = makeParams()
      await submitRecurringSwap(params as never)
      expect(params.request).toHaveBeenCalledTimes(2)
    })

    it('first call is ETH_SEND_TRANSACTION with approve calldata and step: "approve"', async () => {
      const params = makeParams()
      await submitRecurringSwap(params as never)

      const firstCall = (params.request as jest.Mock).mock.calls[0][0]
      expect(firstCall.method).toBe(RpcMethod.ETH_SEND_TRANSACTION)
      expect(firstCall.chainId).toBe('eip155:43114')

      const tx = firstCall.params[0]
      expect(tx.from).toBe(FROM_ADDR)
      expect(tx.to).toBe(TOKEN_IN) // approve target is the token contract
      // approve(address,uint256) selector 0x095ea7b3
      expect((tx.data as string).startsWith('0x095ea7b3')).toBe(true)

      const ctx = firstCall.context[RequestContext.RECURRING_SWAP]
      expect(ctx.step).toBe('approve')
      expect(ctx.quoteUuid).toBe('test-uuid')
      expect(ctx.fromTokenAddress).toBe(TOKEN_IN)
    })

    it('second call is ETH_SEND_TRANSACTION with fill tx data and step: "fill"', async () => {
      const params = makeParams()
      await submitRecurringSwap(params as never)

      const secondCall = (params.request as jest.Mock).mock.calls[1][0]
      expect(secondCall.method).toBe(RpcMethod.ETH_SEND_TRANSACTION)

      const tx = secondCall.params[0]
      expect(tx.from).toBe(FILL_TX.from)
      expect(tx.to).toBe(FILL_TX.to)
      expect(tx.data).toBe(FILL_TX.data)

      const ctx = secondCall.context[RequestContext.RECURRING_SWAP]
      expect(ctx.step).toBe('fill')
    })

    it('grants exactly quote.totalAmountIn as the approve amount', async () => {
      const quote = makeQuote({ totalAmountIn: '9999999' })
      const params = makeParams({ quote })
      await submitRecurringSwap(params as never)

      const firstCall = (params.request as jest.Mock).mock.calls[0][0]
      const data: string = firstCall.params[0].data
      // The amount (9999999 = 0x98967F) should be ABI-encoded in the calldata
      const amountHex = BigInt('9999999').toString(16).padStart(64, '0')
      expect(data).toContain(amountHex)
    })
  })

  describe('when allowance >= totalAmountIn', () => {
    beforeEach(() => {
      // Allowance exactly equals totalAmountIn (4000000) — no approve needed.
      ;(readErc20Allowance as jest.Mock).mockResolvedValue(4_000_000n)
    })

    it('skips the approve step and calls request() only once (fill only)', async () => {
      const params = makeParams()
      await submitRecurringSwap(params as never)
      expect(params.request).toHaveBeenCalledTimes(1)
    })

    it('the single call is for the fill step', async () => {
      const params = makeParams()
      await submitRecurringSwap(params as never)

      const call = (params.request as jest.Mock).mock.calls[0][0]
      const ctx = call.context[RequestContext.RECURRING_SWAP]
      expect(ctx.step).toBe('fill')
    })

    it('does NOT call request() with step: "approve"', async () => {
      const params = makeParams()
      await submitRecurringSwap(params as never)

      const calls = (params.request as jest.Mock).mock.calls
      const hasApprove = calls.some(
        (c: unknown[]) =>
          (c[0] as { context: Record<string, unknown> }).context[
            RequestContext.RECURRING_SWAP
          ] &&
          (
            (c[0] as { context: Record<string, unknown> }).context[
              RequestContext.RECURRING_SWAP
            ] as { step: string }
          ).step === 'approve'
      )
      expect(hasApprove).toBe(false)
    })
  })

  describe('Markr v2.0.0 — recurringSwap POST body', () => {
    beforeEach(() => {
      ;(readErc20Allowance as jest.Mock).mockResolvedValue(99999n)
    })

    it('calls recurringSwap exactly once', async () => {
      const mockService = {
        recurringSwap: jest.fn().mockResolvedValue(FILL_TX)
      }
      ;(getRecurringSwapService as jest.Mock).mockReturnValue(mockService)

      const params = makeParams()
      await submitRecurringSwap(params as never)

      expect(mockService.recurringSwap).toHaveBeenCalledTimes(1)
    })

    it('passes only { uuid, appId } to recurringSwap', async () => {
      const mockService = {
        recurringSwap: jest.fn().mockResolvedValue(FILL_TX)
      }
      ;(getRecurringSwapService as jest.Mock).mockReturnValue(mockService)

      const params = makeParams()
      await submitRecurringSwap(params as never)

      expect(mockService.recurringSwap).toHaveBeenCalledWith({
        uuid: 'test-uuid',
        appId: 'test-app-id'
      })
    })
  })

  describe('isUnlimited flag in context', () => {
    beforeEach(() => {
      ;(readErc20Allowance as jest.Mock).mockResolvedValue(0n)
    })

    it('sets isUnlimited: false when numberOfOrders is finite', async () => {
      const params = makeParams({ numberOfOrders: 10 })
      await submitRecurringSwap(params as never)

      const ctx = (params.request as jest.Mock).mock.calls[0][0].context[
        RequestContext.RECURRING_SWAP
      ] as { isUnlimited: boolean }
      expect(ctx.isUnlimited).toBe(false)
    })

    it('sets isUnlimited: true when numberOfOrders is Infinity', async () => {
      const params = makeParams({ numberOfOrders: Infinity })
      await submitRecurringSwap(params as never)

      const ctx = (params.request as jest.Mock).mock.calls[0][0].context[
        RequestContext.RECURRING_SWAP
      ] as { isUnlimited: boolean }
      expect(ctx.isUnlimited).toBe(true)
    })
  })

  describe('context shape — strict schema compliance', () => {
    beforeEach(() => {
      ;(readErc20Allowance as jest.Mock).mockResolvedValue(0n)
    })

    it('dispatched context has EXACTLY the 15 keys of RecurringSwapApprovalContext (no extra, no missing)', async () => {
      const params = makeParams()
      await submitRecurringSwap(params as never)

      const ctx = (params.request as jest.Mock).mock.calls[0][0].context[
        RequestContext.RECURRING_SWAP
      ] as Record<string, unknown>

      const EXPECTED_KEYS = [
        'amountPerOrder',
        'chainId',
        'frequency',
        'fromTokenAddress',
        'fromTokenDecimals',
        'fromTokenSymbol',
        'intervalSeconds',
        'isUnlimited',
        'numberOfOrders',
        'quoteUuid',
        'step',
        'toTokenAddress',
        'toTokenDecimals',
        'toTokenSymbol',
        'totalAmountIn'
      ]

      expect(Object.keys(ctx).sort()).toEqual(EXPECTED_KEYS)
    })
  })

  describe('intervalSeconds derivation', () => {
    beforeEach(() => {
      ;(readErc20Allowance as jest.Mock).mockResolvedValue(0n)
    })

    it.each([
      [{ unit: 'minute' as const, value: 1 }, 60],
      [{ unit: 'hour' as const, value: 2 }, 7_200],
      [{ unit: 'day' as const, value: 1 }, 86_400],
      [{ unit: 'week' as const, value: 1 }, 604_800],
      [{ unit: 'month' as const, value: 1 }, 2_592_000]
    ])(
      'frequency %p → intervalSeconds %p',
      async (frequency, expectedSeconds) => {
        const params = makeParams({ frequency })
        await submitRecurringSwap(params as never)

        const ctx = (params.request as jest.Mock).mock.calls[0][0].context[
          RequestContext.RECURRING_SWAP
        ] as { intervalSeconds: number }
        expect(ctx.intervalSeconds).toBe(expectedSeconds)
      }
    )
  })
})
