import { RpcMethod } from '@avalabs/vm-module-types'
import { ServiceType, TokenType } from '@avalabs/fusion-sdk'
import { RequestContext } from 'store/rpc/types'
import { createEvmSigner } from './EvmSigner'

jest.mock('utils/Logger', () => ({
  __esModule: true,
  default: { error: jest.fn(), warn: jest.fn(), info: jest.fn() }
}))

jest.mock('utils/caip2ChainIds', () => ({
  getEvmCaip2ChainId: (n: number) => `eip155:${n}`
}))

jest.mock('store/rpc/utils/assert', () => ({
  assert: (cond: unknown, msg: string) => {
    if (!cond) throw new Error(msg)
  }
}))

jest.mock('../../utils/buildRequestContext', () => ({
  buildRequestContext: () => ({})
}))

const makeQuote = (overrides: Record<string, unknown> = {}): unknown => ({
  amountIn: 1_000_000n,
  amountOut: 1_000_000n,
  slippageBps: 50, // 0.5%
  partnerFeeBps: 0,
  // Default to a non-MARKR service so existing single-tx sign tests
  // exercise the regular `eth_sendTransaction` path. Tests that need
  // SWAP_AUTO_APPROVE context override to MARKR explicitly.
  serviceType: ServiceType.AVALANCHE_EVM,
  assetIn: {
    type: TokenType.ERC20,
    address: '0xAAA0000000000000000000000000000000000001',
    decimals: 18,
    symbol: 'SRC',
    name: 'Source'
  },
  assetOut: {
    type: TokenType.ERC20,
    address: '0xBBB0000000000000000000000000000000000002',
    decimals: 6,
    symbol: 'DST',
    name: 'Dest'
  },
  sourceChain: { chainId: 'eip155:43114' },
  targetChain: { chainId: 'eip155:43114' },
  ...overrides
})

const makeStepDetails = (overrides: Record<string, unknown> = {}): never =>
  ({
    currentSignature: 1,
    currentSignatureReason: 'SignSwap',
    requiredSignatures: 1,
    quote: makeQuote(),
    ...overrides
  } as never)

// Default fee fields mirror what Markr's tx generation produces when
// `SwapContext` had `networkFees` loaded and threaded the user's tier
// through `gasSettings`. The signer uses `tx.maxFeePerGas` as a
// precondition for attaching `SWAP_AUTO_APPROVE` (cold-start guard).
const makeTx = (overrides: Record<string, unknown> = {}): never =>
  ({
    from: '0xabc',
    to: '0xdef',
    data: '0x',
    chainId: '43114',
    maxFeePerGas: 25_000_000_000n,
    maxPriorityFeePerGas: 1_500_000_000n,
    ...overrides
  } as never)

describe('createEvmSigner.signBatch', () => {
  it('dispatches eth_sendTransactionBatch when Quick Swaps is active', async () => {
    const request = jest.fn().mockResolvedValue(['0xhash1', '0xhash2'])
    const getOptions = jest.fn().mockReturnValue({
      isQuickSwapsActive: true,
      maxBuy: '5000'
    })

    const signer = createEvmSigner(request, getOptions)
    const result = await signer.signBatch?.(
      [makeTx(), makeTx({ to: '0xrouter' })],
      jest.fn() as never,
      makeStepDetails()
    )

    expect(result).toEqual(['0xhash1', '0xhash2'])
    expect(request).toHaveBeenCalledTimes(1)
    const call = request.mock.calls[0][0]
    expect(call.method).toBe(RpcMethod.ETH_SEND_TRANSACTION_BATCH)
    expect(call.chainId).toBe('eip155:43114')
    expect(call.params.transactions).toHaveLength(2)
    expect(call.params.options).toEqual({ skipIntermediateTxs: true })
    expect(call.context[RequestContext.SWAP_AUTO_APPROVE]).toEqual({
      maxBuy: '5000',
      srcTokenAddress: '0xAAA0000000000000000000000000000000000001',
      destTokenAddress: '0xBBB0000000000000000000000000000000000002',
      isSrcTokenNative: false,
      isDestTokenNative: false,
      slippage: 50,
      // 1_000_000 * (10000 - 50) / 10000 = 995_000
      minAmountOut: '995000',
      // Used by the validator's native-source gas net-out; harmless on
      // ERC-20 sources (the scaling step is skipped when isSrcTokenNative
      // is false).
      amountIn: '1000000',
      partnerFeeBps: 0
    })
  })

  describe('auto-approve context derivation from quote', () => {
    const callBatch = async (quote: Record<string, unknown>) => {
      const request = jest.fn().mockResolvedValue(['0xa', '0xb'])
      const signer = createEvmSigner(request, () => ({
        isQuickSwapsActive: true,
        maxBuy: 'unlimited'
      }))
      // Use 2 txs so signBatch routes through the bypass path
      // (length-1 batches go through the per-tx flow; the EVM module
      // schema requires min 2).
      await signer.signBatch?.(
        [makeTx(), makeTx({ to: '0xrouter' })],
        jest.fn() as never,
        makeStepDetails({ quote: makeQuote(quote) })
      )
      const ctx = (
        request.mock.calls[0]?.[0] as { context: Record<string, unknown> }
      ).context
      return ctx[RequestContext.SWAP_AUTO_APPROVE] as Record<string, unknown>
    }

    it('marks src token native when assetIn.type is NATIVE (no address)', async () => {
      const ctx = await callBatch({
        assetIn: {
          type: TokenType.NATIVE,
          decimals: 18,
          symbol: 'AVAX',
          name: 'Avalanche'
        }
      })
      expect(ctx.isSrcTokenNative).toBe(true)
      expect(ctx.srcTokenAddress).toBeUndefined()
    })

    it('marks dest token native when assetOut.type is NATIVE', async () => {
      const ctx = await callBatch({
        assetOut: {
          type: TokenType.NATIVE,
          decimals: 18,
          symbol: 'AVAX',
          name: 'Avalanche'
        }
      })
      expect(ctx.isDestTokenNative).toBe(true)
      expect(ctx.destTokenAddress).toBeUndefined()
    })

    it('passes quote.partnerFeeBps through to the context', async () => {
      const ctx = await callBatch({ partnerFeeBps: 85 })
      expect(ctx.partnerFeeBps).toBe(85)
    })

    it('defaults partnerFeeBps to 0 when the quote omits it (null)', async () => {
      const ctx = await callBatch({ partnerFeeBps: null })
      expect(ctx.partnerFeeBps).toBe(0)
    })

    it('computes minAmountOut from amountOut and slippageBps', async () => {
      const ctx = await callBatch({
        amountOut: 100n,
        slippageBps: 100 // 1%
      })
      // 100 * (10000-100)/10000 = 99
      expect(ctx.minAmountOut).toBe('99')
    })

    it('forwards slippageBps untouched as basis points', async () => {
      const ctx = await callBatch({ slippageBps: 250 })
      expect(ctx.slippage).toBe(250)
    })
  })

  it('falls back to per-tx sign() when Quick Swaps is OFF (without receipt wait)', async () => {
    const request = jest
      .fn<Promise<string>, [unknown]>()
      .mockResolvedValueOnce('0xhashA')
      .mockResolvedValueOnce('0xhashB')
    const getOptions = jest.fn().mockReturnValue({
      isQuickSwapsActive: false,
      maxBuy: 'unlimited'
    })
    const waitForReceipt = jest.fn().mockResolvedValue(undefined)

    const signer = createEvmSigner(request, getOptions, waitForReceipt)
    const result = await signer.signBatch?.(
      [makeTx(), makeTx({ to: '0xrouter' })],
      jest.fn() as never,
      makeStepDetails()
    )

    expect(result).toEqual(['0xhashA', '0xhashB'])
    expect(request).toHaveBeenCalledTimes(2)
    // Legacy path: no receipt wait between txs (preserves pre-Quick-Swaps latency)
    expect(waitForReceipt).not.toHaveBeenCalled()
    expect(
      request.mock.calls.every(
        c =>
          (c[0] as { method: RpcMethod }).method ===
          RpcMethod.ETH_SEND_TRANSACTION
      )
    ).toBe(true)
    // No SWAP_AUTO_APPROVE on per-tx fallback path
    expect(request.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        context: expect.not.objectContaining({
          [RequestContext.SWAP_AUTO_APPROVE]: expect.anything()
        })
      })
    )
  })

  it('falls back to per-tx sign() when any batch tx is missing fees (cold-start guard)', async () => {
    // `SwapContext` may dispatch a swap before `useNetworkFee` has
    // returned data — gasSettings.maxFeePerGas stays undefined, Markr
    // emits batch txs without fee fields. The bypass must NOT fire in
    // that state because the broadcast would reject with
    // `gas fee cap (0) < pool minimum fee cap (1)`. Per-tx flow lets
    // `onApprove` collect fees normally.
    const request = jest
      .fn<Promise<string>, [unknown]>()
      .mockResolvedValueOnce('0xhashA')
      .mockResolvedValueOnce('0xhashB')
    const getOptions = jest.fn().mockReturnValue({
      isQuickSwapsActive: true,
      maxBuy: 'unlimited'
    })
    const signer = createEvmSigner(request, getOptions)

    const result = await signer.signBatch?.(
      [
        makeTx({ maxFeePerGas: undefined, maxPriorityFeePerGas: undefined }),
        makeTx({
          to: '0xrouter',
          maxFeePerGas: undefined,
          maxPriorityFeePerGas: undefined
        })
      ],
      jest.fn() as never,
      makeStepDetails()
    )

    expect(result).toEqual(['0xhashA', '0xhashB'])
    // No batch dispatch — went straight to per-tx flow
    expect(
      request.mock.calls.every(
        c =>
          (c[0] as { method: RpcMethod }).method ===
          RpcMethod.ETH_SEND_TRANSACTION
      )
    ).toBe(true)
  })

  it('falls back to per-tx sign() for cross-chain quotes (sourceChainId !== targetChainId)', async () => {
    // Cross-chain swaps are structurally unverifiable by the validator
    // (Blockaid simulation is single-chain). Mirrors core-extension's
    // `!isCrossChainSwap` upstream gate.
    const request = jest
      .fn<Promise<string>, [unknown]>()
      .mockResolvedValueOnce('0xhashA')
      .mockResolvedValueOnce('0xhashB')
    const signer = createEvmSigner(request, () => ({
      isQuickSwapsActive: true,
      maxBuy: 'unlimited'
    }))

    await signer.signBatch?.(
      [makeTx(), makeTx({ to: '0xrouter' })],
      jest.fn() as never,
      makeStepDetails({
        quote: makeQuote({
          sourceChain: { chainId: 'eip155:43114' },
          targetChain: { chainId: 'eip155:1' }
        })
      })
    )

    expect(
      request.mock.calls.every(
        c =>
          (c[0] as { method: RpcMethod }).method ===
          RpcMethod.ETH_SEND_TRANSACTION
      )
    ).toBe(true)
  })

  it('reads getBatchOptions at call time, not signer-creation time', async () => {
    let isActive = false
    const request = jest.fn().mockResolvedValue(['0xa', '0xb'])
    const getOptions = jest.fn().mockImplementation(() => ({
      isQuickSwapsActive: isActive,
      maxBuy: 'unlimited'
    }))
    const signer = createEvmSigner(request, getOptions)

    isActive = true

    await signer.signBatch?.(
      [makeTx(), makeTx({ to: '0xrouter' })],
      jest.fn() as never,
      makeStepDetails()
    )
    expect(request).toHaveBeenCalledTimes(1)
    expect((request.mock.calls[0]?.[0] as { method: RpcMethod }).method).toBe(
      RpcMethod.ETH_SEND_TRANSACTION_BATCH
    )
  })

  it('falls back to per-tx sign() when bypass returns manual-review marker', async () => {
    // First call (eth_sendTransactionBatch) rejects with the validator's
    // manual-review marker. Subsequent calls (per-tx eth_sendTransaction)
    // succeed and return the tx hash array.
    const manualReviewError = Object.assign(
      new Error(
        'Quick Swaps requires manual review for this swap (Slippage tolerance exceeded).'
      ),
      {
        data: { quickSwapsManualReview: true, code: 'slippage_exceeded' }
      }
    )
    const request = jest
      .fn<Promise<string>, [unknown]>()
      .mockRejectedValueOnce(manualReviewError)
      .mockResolvedValueOnce('0xhashA')
      .mockResolvedValueOnce('0xhashB')
    const getOptions = jest.fn().mockReturnValue({
      isQuickSwapsActive: true,
      maxBuy: 'unlimited'
    })
    const signer = createEvmSigner(request, getOptions)

    const result = await signer.signBatch?.(
      [makeTx(), makeTx({ to: '0xrouter' })],
      jest.fn() as never,
      makeStepDetails()
    )

    expect(result).toEqual(['0xhashA', '0xhashB'])
    // 1 batch attempt + 2 per-tx fallbacks
    expect(request).toHaveBeenCalledTimes(3)
    expect((request.mock.calls[0]?.[0] as { method: RpcMethod }).method).toBe(
      RpcMethod.ETH_SEND_TRANSACTION_BATCH
    )
    expect((request.mock.calls[1]?.[0] as { method: RpcMethod }).method).toBe(
      RpcMethod.ETH_SEND_TRANSACTION
    )
    expect((request.mock.calls[2]?.[0] as { method: RpcMethod }).method).toBe(
      RpcMethod.ETH_SEND_TRANSACTION
    )
  })

  it('forwards the manual-review reason to per-tx sign() context on fallback', async () => {
    const manualReviewError = Object.assign(
      new Error('Quick Swaps requires manual review (Slippage exceeded).'),
      {
        data: {
          quickSwapsManualReview: true,
          code: 'slippage_exceeded',
          reason: 'Slippage tolerance exceeded'
        }
      }
    )
    const request = jest
      .fn<Promise<string>, [unknown]>()
      .mockRejectedValueOnce(manualReviewError)
      .mockResolvedValueOnce('0xhashA')
      .mockResolvedValueOnce('0xhashB')
    const signer = createEvmSigner(request, () => ({
      isQuickSwapsActive: true,
      maxBuy: 'unlimited'
    }))

    await signer.signBatch?.(
      [makeTx(), makeTx({ to: '0xrouter' })],
      jest.fn() as never,
      makeStepDetails()
    )

    expect(request).toHaveBeenCalledTimes(3)
    const perTxCall1 = request.mock.calls[1]?.[0] as {
      context?: Record<string, unknown>
    }
    const perTxCall2 = request.mock.calls[2]?.[0] as {
      context?: Record<string, unknown>
    }
    expect(perTxCall1?.context?.quickSwapsManualReviewReason).toBe(
      'Slippage tolerance exceeded'
    )
    expect(perTxCall2?.context?.quickSwapsManualReviewReason).toBe(
      'Slippage tolerance exceeded'
    )
  })

  it('suppresses tx feedback (toast/confetti) on intermediate per-tx fallback steps', async () => {
    const manualReviewError = Object.assign(new Error('fell back'), {
      data: { quickSwapsManualReview: true, code: 'tx_flagged_warning' }
    })
    const request = jest
      .fn<Promise<string>, [unknown]>()
      .mockRejectedValueOnce(manualReviewError)
      .mockResolvedValueOnce('0xhashA')
      .mockResolvedValueOnce('0xhashB')
    const signer = createEvmSigner(request, () => ({
      isQuickSwapsActive: true,
      maxBuy: 'unlimited'
    }))

    await signer.signBatch?.(
      [makeTx(), makeTx({ to: '0xrouter' })],
      jest.fn() as never,
      makeStepDetails()
    )

    const perTxCall1 = request.mock.calls[1]?.[0] as {
      context?: Record<string, unknown>
    }
    const perTxCall2 = request.mock.calls[2]?.[0] as {
      context?: Record<string, unknown>
    }
    expect(perTxCall1?.context?.suppressTxFeedback).toBe(true)
    expect(perTxCall2?.context?.suppressTxFeedback).toBeUndefined()
  })

  it('waits for the previous tx receipt between per-tx fallback steps', async () => {
    const manualReviewError = Object.assign(new Error('fell back'), {
      data: {
        quickSwapsManualReview: true,
        code: 'balance_change_missing',
        reason: 'Unable to verify balance change information'
      }
    })
    const request = jest
      .fn<Promise<string>, [unknown]>()
      .mockRejectedValueOnce(manualReviewError)
      .mockResolvedValueOnce('0xhashA')
      .mockResolvedValueOnce('0xhashB')
    const waitForReceipt = jest.fn().mockResolvedValue(undefined)
    const signer = createEvmSigner(
      request,
      () => ({ isQuickSwapsActive: true, maxBuy: 'unlimited' }),
      waitForReceipt
    )

    await signer.signBatch?.(
      [makeTx(), makeTx({ to: '0xrouter' })],
      jest.fn() as never,
      makeStepDetails()
    )

    expect(waitForReceipt).toHaveBeenCalledTimes(1)
    expect(waitForReceipt).toHaveBeenCalledWith(expect.any(Number), '0xhashA')
  })

  it('swallows receipt-wait errors and continues to the next tx', async () => {
    const manualReviewError = Object.assign(new Error('fell back'), {
      data: {
        quickSwapsManualReview: true,
        code: 'balance_change_missing',
        reason: 'Unable to verify balance change information'
      }
    })
    const request = jest
      .fn<Promise<string>, [unknown]>()
      .mockRejectedValueOnce(manualReviewError)
      .mockResolvedValueOnce('0xhashA')
      .mockResolvedValueOnce('0xhashB')
    const waitForReceipt = jest
      .fn()
      .mockRejectedValue(new Error('receipt timeout'))
    const signer = createEvmSigner(
      request,
      () => ({ isQuickSwapsActive: true, maxBuy: 'unlimited' }),
      waitForReceipt
    )

    const result = await signer.signBatch?.(
      [makeTx(), makeTx({ to: '0xrouter' })],
      jest.fn() as never,
      makeStepDetails()
    )

    expect(result).toEqual(['0xhashA', '0xhashB'])
    expect(waitForReceipt).toHaveBeenCalledTimes(1)
  })

  it('suppresses swapAutoApprove on every per-tx call when the batch falls back', async () => {
    const manualReviewError = Object.assign(new Error('fell back'), {
      data: {
        quickSwapsManualReview: true,
        code: 'tx_flagged_warning',
        reason: 'Transaction safety check returned Warning'
      }
    })
    const request = jest
      .fn<Promise<string>, [unknown]>()
      .mockRejectedValueOnce(manualReviewError)
      .mockResolvedValueOnce('0xhashA')
      .mockResolvedValueOnce('0xhashB')
    const signer = createEvmSigner(request, () => ({
      isQuickSwapsActive: true,
      maxBuy: 'unlimited'
    }))

    await signer.signBatch?.(
      [makeTx(), makeTx({ to: '0xrouter' })],
      jest.fn() as never,
      makeStepDetails()
    )

    const perTxCall1 = request.mock.calls[1]?.[0] as {
      context?: Record<string, unknown>
    }
    const perTxCall2 = request.mock.calls[2]?.[0] as {
      context?: Record<string, unknown>
    }
    expect(perTxCall1?.context?.swapAutoApprove).toBeUndefined()
    expect(perTxCall2?.context?.swapAutoApprove).toBeUndefined()
  })

  it('omits the manual-review-reason context when the marker error has no reason', async () => {
    const manualReviewError = Object.assign(new Error('marker only'), {
      data: { quickSwapsManualReview: true, code: 'slippage_exceeded' }
    })
    const request = jest
      .fn<Promise<string>, [unknown]>()
      .mockRejectedValueOnce(manualReviewError)
      .mockResolvedValueOnce('0xhashA')
      .mockResolvedValueOnce('0xhashB')
    const signer = createEvmSigner(request, () => ({
      isQuickSwapsActive: true,
      maxBuy: 'unlimited'
    }))

    await signer.signBatch?.(
      [makeTx(), makeTx({ to: '0xrouter' })],
      jest.fn() as never,
      makeStepDetails()
    )

    const perTxCall = request.mock.calls[1]?.[0] as {
      context?: Record<string, unknown>
    }
    expect(perTxCall?.context?.quickSwapsManualReviewReason).toBeUndefined()
  })

  it('rethrows non-manual-review errors from the bypass path', async () => {
    const realError = new Error('network down')
    const request = jest.fn().mockRejectedValue(realError)
    const signer = createEvmSigner(request, () => ({
      isQuickSwapsActive: true,
      maxBuy: 'unlimited'
    }))

    await expect(
      signer.signBatch?.(
        [makeTx(), makeTx({ to: '0xrouter' })],
        jest.fn() as never,
        makeStepDetails()
      )
    ).rejects.toThrow('network down')
    // Did NOT fall back to per-tx
    expect(request).toHaveBeenCalledTimes(1)
  })

  it('throws when called with empty transactions array', async () => {
    const request = jest.fn()
    const signer = createEvmSigner(request, () => ({
      isQuickSwapsActive: true,
      maxBuy: 'unlimited'
    }))

    await expect(
      signer.signBatch?.([], jest.fn() as never, makeStepDetails())
    ).rejects.toThrow(/no transactions/)
    expect(request).not.toHaveBeenCalled()
  })

  it('serializes bigint fields to hex before sending', async () => {
    const request = jest.fn().mockResolvedValue(['0xa', '0xb'])
    const signer = createEvmSigner(request, () => ({
      isQuickSwapsActive: true,
      maxBuy: 'unlimited'
    }))

    await signer.signBatch?.(
      [
        makeTx({
          value: 1000000000000000000n,
          gasLimit: 21000n,
          maxFeePerGas: 50_000_000_000n
        }),
        makeTx({ to: '0xrouter' })
      ],
      jest.fn() as never,
      makeStepDetails()
    )
    const tx = (
      request.mock.calls[0][0] as { params: { transactions: unknown[] } }
    ).params.transactions[0] as Record<string, unknown>
    expect(tx.value).toBe('0xde0b6b3a7640000')
    expect(tx.gasLimit).toBe('0x5208')
    expect(tx.maxFeePerGas).toBe('0xba43b7400')
  })
})

describe('createEvmSigner.sign — single-tx auto-approve context', () => {
  // Single-tx Markr swaps (native source, repeat-allowance ERC-20)
  // flow through `sign` and dispatch the standard `eth_sendTransaction`.
  // When Quick Swaps is active and the swap is Markr (not an approve),
  // the signer attaches `SWAP_AUTO_APPROVE` to `request.context` so
  // `ApprovalController.requestApproval` → `SwapValidator` can sign
  // the tx without showing the modal.
  const markrStepDetails = makeStepDetails({
    quote: makeQuote({ serviceType: ServiceType.MARKR })
  })

  it('attaches SWAP_AUTO_APPROVE context for Markr single-tx swap when Quick Swaps is active', async () => {
    const request = jest.fn().mockResolvedValue('0xhashSingle')
    const signer = createEvmSigner(request, () => ({
      isQuickSwapsActive: true,
      maxBuy: '5000'
    }))

    const result = await signer.sign(
      makeTx(),
      jest.fn() as never,
      markrStepDetails
    )

    expect(result).toBe('0xhashSingle')
    expect(request).toHaveBeenCalledTimes(1)
    const call = request.mock.calls[0][0]
    expect(call.method).toBe(RpcMethod.ETH_SEND_TRANSACTION)
    expect(call.context[RequestContext.SWAP_AUTO_APPROVE]).toEqual(
      expect.objectContaining({
        maxBuy: '5000',
        srcTokenAddress: '0xAAA0000000000000000000000000000000000001',
        destTokenAddress: '0xBBB0000000000000000000000000000000000002'
      })
    )
  })

  it('does NOT attach SWAP_AUTO_APPROVE when Quick Swaps is OFF', async () => {
    const request = jest.fn().mockResolvedValue('0xhashSingle')
    const signer = createEvmSigner(request, () => ({
      isQuickSwapsActive: false,
      maxBuy: 'unlimited'
    }))

    await signer.sign(makeTx(), jest.fn() as never, markrStepDetails)

    expect(request).toHaveBeenCalledTimes(1)
    const call = request.mock.calls[0][0]
    expect(call.method).toBe(RpcMethod.ETH_SEND_TRANSACTION)
    expect(call.context[RequestContext.SWAP_AUTO_APPROVE]).toBeUndefined()
  })

  it('does NOT attach SWAP_AUTO_APPROVE for non-Markr services even when Quick Swaps is on', async () => {
    const request = jest.fn().mockResolvedValue('0xhashSingle')
    const signer = createEvmSigner(request, () => ({
      isQuickSwapsActive: true,
      maxBuy: 'unlimited'
    }))

    // makeStepDetails default uses serviceType: AVALANCHE_EVM (not MARKR)
    await signer.sign(makeTx(), jest.fn() as never, makeStepDetails())

    expect(request).toHaveBeenCalledTimes(1)
    const call = request.mock.calls[0][0]
    expect(call.method).toBe(RpcMethod.ETH_SEND_TRANSACTION)
    expect(call.context[RequestContext.SWAP_AUTO_APPROVE]).toBeUndefined()
  })

  it('does NOT attach SWAP_AUTO_APPROVE for ERC-20 approve txs (selector 0x095ea7b3)', async () => {
    const request = jest.fn().mockResolvedValue('0xhashApprove')
    const signer = createEvmSigner(request, () => ({
      isQuickSwapsActive: true,
      maxBuy: '5000'
    }))

    // ERC-20 `approve(spender, amount)` selector
    const approveTx = makeTx({
      data: '0x095ea7b3000000000000000000000000aaa00000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000064'
    })

    await signer.sign(approveTx, jest.fn() as never, markrStepDetails)

    expect(request).toHaveBeenCalledTimes(1)
    const call = request.mock.calls[0][0]
    expect(call.method).toBe(RpcMethod.ETH_SEND_TRANSACTION)
    expect(call.context[RequestContext.SWAP_AUTO_APPROVE]).toBeUndefined()
  })

  // Pinned regression: if Markr ever switches signing schemes (e.g.
  // `increaseAllowance` or Permit2), this test will start failing
  // because the bypass will fire on what is effectively still an
  // allowance change. Fix `isApproveTx` to widen the selector set
  // before allowing the bypass for those flows.
  it('Markr is assumed to use only the canonical 0x095ea7b3 approve — widen isApproveTx if this changes', async () => {
    const request = jest.fn().mockResolvedValue('0xhashIncrease')
    const signer = createEvmSigner(request, () => ({
      isQuickSwapsActive: true,
      maxBuy: '5000'
    }))

    // increaseAllowance(spender, amount) — 0x39509351 — not currently
    // detected by isApproveTx.
    const increaseAllowanceTx = makeTx({
      data: '0x39509351000000000000000000000000aaa00000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000064'
    })

    await signer.sign(increaseAllowanceTx, jest.fn() as never, markrStepDetails)

    expect(request).toHaveBeenCalledTimes(1)
    const call = request.mock.calls[0][0]
    // Today: bypass fires on increaseAllowance because the selector
    // isn't in ERC20_APPROVE_SELECTORS. If Markr ever emits these,
    // widen the set or this assertion's expectation flips.
    expect(call.context[RequestContext.SWAP_AUTO_APPROVE]).toBeDefined()
  })

  it('does NOT attach SWAP_AUTO_APPROVE when tx.maxFeePerGas is missing (cold-start guard)', async () => {
    // Simulates `SwapContext` not having `networkFees` loaded yet, so
    // `gasSettings.maxFeePerGas` was undefined and Markr emitted a tx
    // without fees. Bypass would broadcast `maxFeePerGas: 0` and the
    // RPC would reject — falling through to the standard modal lets
    // `onApprove` collect fees normally.
    const request = jest.fn().mockResolvedValue('0xhashSingle')
    const signer = createEvmSigner(request, () => ({
      isQuickSwapsActive: true,
      maxBuy: '5000'
    }))

    const txWithoutFees = makeTx({
      maxFeePerGas: undefined,
      maxPriorityFeePerGas: undefined
    })

    await signer.sign(txWithoutFees, jest.fn() as never, markrStepDetails)

    expect(request).toHaveBeenCalledTimes(1)
    const call = request.mock.calls[0][0]
    expect(call.method).toBe(RpcMethod.ETH_SEND_TRANSACTION)
    expect(call.context[RequestContext.SWAP_AUTO_APPROVE]).toBeUndefined()
  })

  it('does NOT attach SWAP_AUTO_APPROVE for cross-chain quotes (sourceChainId !== targetChainId)', async () => {
    const request = jest.fn().mockResolvedValue('0xhashSingle')
    const signer = createEvmSigner(request, () => ({
      isQuickSwapsActive: true,
      maxBuy: '5000'
    }))

    const crossChainStepDetails = makeStepDetails({
      quote: makeQuote({
        serviceType: ServiceType.MARKR,
        sourceChain: { chainId: 'eip155:43114' },
        targetChain: { chainId: 'eip155:1' }
      })
    })

    await signer.sign(makeTx(), jest.fn() as never, crossChainStepDetails)

    expect(request).toHaveBeenCalledTimes(1)
    const call = request.mock.calls[0][0]
    expect(call.method).toBe(RpcMethod.ETH_SEND_TRANSACTION)
    expect(call.context[RequestContext.SWAP_AUTO_APPROVE]).toBeUndefined()
  })
})
