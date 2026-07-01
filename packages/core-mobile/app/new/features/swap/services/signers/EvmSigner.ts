import { hex, utf8 } from '@scure/base'
import { bigIntToHex } from '@ethereumjs/util'
import { RpcMethod } from '@avalabs/vm-module-types'
import {
  EvmSignerWithMessage,
  EvmTransactionRequest,
  ServiceType,
  TokenType,
  type Quote
} from '@avalabs/fusion-sdk'
import { getEvmCaip2ChainId } from 'utils/caip2ChainIds'
import { Request } from 'store/rpc/utils/createInAppRequest'
import { assert } from 'store/rpc/utils/assert'
import Logger from 'utils/Logger'
import { RequestContext, type SwapAutoApproveContext } from 'store/rpc/types'
import type { QuickSwapMaxBuy } from 'store/settings/advanced/types'
import {
  isRecurringOrderActionSignatureReason,
  isRecurringTransferSignatureReason,
  readRecurringSignerContext
} from 'features/recurringSwap/services/recurringSignerContext'
import { BASIS_POINTS_DIVISOR } from '../../consts'
import { buildRequestContext } from '../../utils/buildRequestContext'
import { BatchSigningUnsupportedError } from './errors'

// Getter (not captured value) so the signer reads the latest settings
// even if the user toggles Quick Swaps between init and execution.
export type SignBatchOptionsGetter = () => {
  isQuickSwapsActive: boolean
  maxBuy: QuickSwapMaxBuy
  // True only for wallets that can return signed txs without a per-tx
  // approval (MNEMONIC / SEEDLESS / PRIVATE_KEY). From
  // QUICK_SWAPS_SOFTWARE_WALLET_TYPES.
  isBatchSigningSupported: boolean
}

// Common hex-encoded tx fields shared by single-tx eth_sendTransaction
// and batch eth_sendTransactionBatch params. Optional fields are only
// included when present so the SDK's Zod schema doesn't reject them.
const toHexTx = (tx: EvmTransactionRequest): Record<string, unknown> => ({
  from: tx.from,
  to: tx.to ?? undefined,
  data: tx.data ?? undefined,
  value: typeof tx.value === 'bigint' ? bigIntToHex(tx.value) : undefined,
  chainId: tx.chainId,
  ...(typeof tx.gasLimit === 'bigint'
    ? { gasLimit: bigIntToHex(tx.gasLimit) }
    : {}),
  ...(typeof tx.maxFeePerGas === 'bigint'
    ? { maxFeePerGas: bigIntToHex(tx.maxFeePerGas) }
    : {}),
  ...(typeof tx.maxPriorityFeePerGas === 'bigint'
    ? { maxPriorityFeePerGas: bigIntToHex(tx.maxPriorityFeePerGas) }
    : {}),
  ...(typeof tx.gasPrice === 'bigint'
    ? { gasPrice: bigIntToHex(tx.gasPrice) }
    : {}),
  ...(tx.nonce !== undefined ? { nonce: tx.nonce } : {})
})

// Batch additionally carries `type` (EIP-1559 envelope tag). Single-tx
// eth_sendTransaction omits it — historical wire format that the EVM
// module already infers from maxFeePerGas presence.
const normalizeBatchTx = (
  tx: EvmTransactionRequest
): Record<string, unknown> => ({
  ...toHexTx(tx),
  ...(tx.type !== undefined && tx.type !== null ? { type: tx.type } : {})
})

// Approves shouldn't bypass: Blockaid's assets_diffs is empty for
// approves (allowance changes live in exposures, not balances) — the
// validator would hit balance_change_missing. Plus, the spend-limit
// modal is a security affordance worth preserving on Quick Swaps too.
//
// CAVEAT: This only catches the canonical ERC-20 `approve(address,uint256)`
// selector (0x095ea7b3). It does NOT catch:
//   - increaseAllowance(0x39509351)
//   - Permit2.permit / approve flows (EIP-2612 etc.)
//   - Custom router pre-auth functions
// Today Markr only uses standard ERC-20 approves in the batch, so this
// is sufficient. If Markr ever changes its signing scheme this guard
// must be widened — see core-extension's `isApproveTx` for parity.
const ERC20_APPROVE_SELECTORS: ReadonlySet<string> = new Set([
  '0x095ea7b3' // approve(address,uint256)
])

const isApproveTx = (data: string | null | undefined): boolean => {
  if (typeof data !== 'string' || data.length < 10) return false
  const selector = data.slice(0, 10).toLowerCase()
  return ERC20_APPROVE_SELECTORS.has(selector)
}

// Cross-chain bypass is structurally unverifiable: Blockaid simulation is
// single-chain so the validator can't confirm destination-side delivery.
// Skip the bypass attempt rather than letting the validator fall back via
// balance_change_missing (cleaner telemetry, fewer noise events). Matches
// core-extension's upstream gate.
const isCrossChainQuote = (quote: Quote): boolean =>
  quote.sourceChain.chainId.toLowerCase() !==
  quote.targetChain.chainId.toLowerCase()

export const getChainIdForBatch = (
  transactions: readonly EvmTransactionRequest[]
): number => {
  const first = transactions[0]
  assert(first, 'signBatch called with empty transactions array')
  const chainId = Number(first.chainId)
  for (const tx of transactions) {
    assert(
      Number(tx.chainId) === chainId,
      'MultipleChainIdsInBatch: all transactions in a batch must share one chainId'
    )
  }
  return chainId
}

const BPS_DIVISOR_BIGINT = BigInt(BASIS_POINTS_DIVISOR)

// minAmountOut nets out included fees: Markr deducts fees with
// fundingModel='included' from amountOut before the user receives
// anything, so the on-chain minOut must be enforced against the net.
// Computing from the gross would systematically reject small swaps.
const buildAutoApproveContext = (
  quote: Quote,
  maxBuy: QuickSwapMaxBuy
): SwapAutoApproveContext => {
  const {
    assetIn,
    assetOut,
    amountIn,
    amountOut,
    slippageBps,
    partnerFeeBps,
    fees
  } = quote
  const isSrcTokenNative = assetIn.type === TokenType.NATIVE
  const isDestTokenNative = assetOut.type === TokenType.NATIVE
  const slippageBpsBigInt = BigInt(slippageBps)
  // Sum fee items with fundingModel: 'included' — Markr deducts these
  // from amountOut before the user receives anything.
  const includedFeeSum = (fees ?? []).reduce<bigint>((acc, fee) => {
    return fee.fundingModel === 'included' ? acc + BigInt(fee.amount) : acc
  }, 0n)
  const netAmountOut =
    amountOut > includedFeeSum ? amountOut - includedFeeSum : amountOut
  const minAmountOut =
    (netAmountOut * (BPS_DIVISOR_BIGINT - slippageBpsBigInt)) /
    BPS_DIVISOR_BIGINT

  return {
    maxBuy,
    srcTokenAddress: isSrcTokenNative
      ? undefined
      : (assetIn as { address?: string }).address,
    destTokenAddress: isDestTokenNative
      ? undefined
      : (assetOut as { address?: string }).address,
    isSrcTokenNative,
    isDestTokenNative,
    slippage: slippageBps,
    minAmountOut: minAmountOut.toString(),
    amountIn: amountIn.toString(),
    // Pass the quote-attested fee, not a constant. Validator will use
    // this in the USD-loss tolerance math so a future fee bump or
    // partner-specific override doesn't reject valid swaps.
    partnerFeeBps: partnerFeeBps ?? 0
  }
}

const dispatchAsBatch = async (
  request: Request,
  transactions: readonly EvmTransactionRequest[],
  options: { stepDetails: { quote: Quote }; maxBuy: QuickSwapMaxBuy }
): Promise<readonly `0x${string}`[]> => {
  const { stepDetails, maxBuy } = options
  const result = await request({
    method: RpcMethod.ETH_SEND_TRANSACTION_BATCH,
    params: {
      transactions: transactions.map(normalizeBatchTx),
      options: { skipIntermediateTxs: true }
    },
    chainId: getEvmCaip2ChainId(getChainIdForBatch(transactions)),
    context: {
      ...buildRequestContext(stepDetails as never),
      [RequestContext.SWAP_AUTO_APPROVE]: buildAutoApproveContext(
        stepDetails.quote,
        maxBuy
      )
    }
  })
  return result as unknown as readonly `0x${string}`[]
}

// Recurring batches must be user-approved (never silently auto-approved), so we
// dispatch WITHOUT SWAP_AUTO_APPROVE context. `evaluateBatchApproval` finds no
// validator for a batch lacking that context and returns `{kind:'manual'}`,
// opening the manual `BatchApprovalScreen`. We attach RECURRING_SWAP context
// ourselves (mirroring what `signOne` does for the per-tx path) so the screen
// renders `<RecurrenceDetails/>`. The signed array is returned to the SDK,
// which broadcasts — signBatch does NOT self-broadcast here, so it is atomic
// w.r.t. our wallet and safe under fallbackToDefaultOnBatchFailure. (CP-14641)
const dispatchRecurringBatch = async (
  request: Request,
  transactions: readonly EvmTransactionRequest[],
  stepDetails: Parameters<EvmSignerWithMessage['sign']>[2]
): Promise<readonly `0x${string}`[]> => {
  const rawContext = buildRequestContext(stepDetails)
  const recurringActive = readRecurringSignerContext(stepDetails)
  const isRecurringOrderAction = isRecurringOrderActionSignatureReason(
    stepDetails.currentSignatureReason
  )
  const context = recurringActive
    ? {
        ...rawContext,
        [RequestContext.RECURRING_SWAP]: recurringActive,
        ...(isRecurringOrderAction
          ? { [RequestContext.CONFETTI_DISABLED]: true }
          : {})
      }
    : rawContext

  const result = await request({
    method: RpcMethod.ETH_SEND_TRANSACTION_BATCH,
    params: {
      transactions: transactions.map(normalizeBatchTx),
      options: { skipIntermediateTxs: true }
    },
    chainId: getEvmCaip2ChainId(getChainIdForBatch(transactions)),
    context
  })
  return result as unknown as readonly `0x${string}`[]
}

// Awaited by signEachManually between non-final txs to prevent the
// "exceeds allowance" race when the approve hasn't mined before the
// swap's estimateGas runs. Pre-CP-14211 the Fusion SDK awaited the
// approve receipt itself (Markr's individual-sign branch); exposing
// `signBatch` flipped the SDK into the batch branch which delegates
// ordering to us, so we must replicate the wait on every intermediate
// per-tx step.
export type WaitForReceipt = (
  chainId: number,
  txHash: `0x${string}`
) => Promise<void>

export function createEvmSigner(
  request: Request,
  getBatchOptions: SignBatchOptionsGetter,
  waitForReceipt?: WaitForReceipt
): EvmSignerWithMessage {
  type SignOptions = {
    manualReviewReason?: string
    isIntermediate?: boolean
  }
  const signOne = async (
    tx: Parameters<EvmSignerWithMessage['sign']>[0],
    stepDetails: Parameters<EvmSignerWithMessage['sign']>[2],
    options: SignOptions
  ): Promise<`0x${string}`> => {
    const { manualReviewReason, isIntermediate } = options
    const { from, data, to, chainId } = tx
    assert(to, 'Invalid transaction: missing "to" field')
    assert(from, 'Invalid transaction: missing "from" field')
    assert(data, 'Invalid transaction: missing "data" field')
    assert(chainId, 'Invalid transaction: missing "chainId" field')

    const { isQuickSwapsActive, maxBuy } = getBatchOptions()
    const isApprove = isApproveTx(typeof data === 'string' ? data : undefined)
    // Cold-start guard: tx.maxFeePerGas must already be filled by
    // Markr (proves networkFees was loaded). The bypass skips the
    // modal's fee picker, so missing-fees would broadcast as 0.
    const hasUpstreamFees = typeof tx.maxFeePerGas === 'bigint'
    // Recurring synthetic Quotes have `serviceType === ServiceType.MARKR`
    // (same as one-shot Markr swaps), so the existing serviceType gate alone
    // would let recurring through. Exclude them explicitly — recurring TXs
    // must always render the approval modal so the user sees the
    // "Scheduling / Cancelling / Pausing / Resuming recurring swap" preview.
    const isRecurring = isRecurringTransferSignatureReason(
      stepDetails.currentSignatureReason
    )
    // On batch fallback we suppress autoApprove on every per-tx call so
    // both the approve and the swap modal render the "Manual approval
    // required" banner — otherwise the swap could auto-approve silently
    // while the approve showed the banner.
    const shouldAttachAutoApprove =
      !manualReviewReason &&
      isQuickSwapsActive &&
      stepDetails.quote.serviceType === ServiceType.MARKR &&
      !isRecurring &&
      !isApprove &&
      hasUpstreamFees &&
      !isCrossChainQuote(stepDetails.quote)
    const rawContext = buildRequestContext(stepDetails)
    // The SDK passes the same stepDetails for every per-tx call in a
    // batch fallback, so buildRequestContext can't tell intermediate
    // from final on its own — mark non-final explicitly to suppress
    // the intermediate-tx confetti/toast.
    const baseContext = isIntermediate
      ? { ...rawContext, [RequestContext.SUPPRESS_TX_FEEDBACK]: true }
      : rawContext
    const contextWithAutoApprove = shouldAttachAutoApprove
      ? {
          ...baseContext,
          [RequestContext.SWAP_AUTO_APPROVE]: buildAutoApproveContext(
            stepDetails.quote,
            maxBuy
          )
        }
      : baseContext
    const contextWithManualReview = manualReviewReason
      ? {
          ...contextWithAutoApprove,
          [RequestContext.QUICK_SWAPS_MANUAL_REVIEW_REASON]: manualReviewReason
        }
      : contextWithAutoApprove

    // When the step is a recurring one (detected via
    // `currentSignatureReason`, see `isRecurring` above), read the display
    // metadata back off `stepDetails.signerContext` — the SDK forwards
    // whatever the originating execute call passed as `signerContext`
    // unchanged onto each step. Attach it as RECURRING_SWAP so
    // ApprovalScreen renders `<RecurrenceDetails />` above the standard
    // tx details. Riding the payload with the request itself means two
    // concurrent same-type actions can no longer collide on a shared
    // module-level slot (the failure mode the old `activeActionContext`
    // map was defending against).
    const recurringActive = isRecurring
      ? readRecurringSignerContext(stepDetails)
      : undefined
    // Cancel / pause / resume are schedule-management actions, not a
    // completed swap — suppress the success confetti (schedule creation and
    // recurring fills keep their normal feedback).
    const isRecurringOrderAction = isRecurringOrderActionSignatureReason(
      stepDetails.currentSignatureReason
    )
    const requestContext = recurringActive
      ? {
          ...contextWithManualReview,
          [RequestContext.RECURRING_SWAP]: recurringActive,
          ...(isRecurringOrderAction
            ? { [RequestContext.CONFETTI_DISABLED]: true }
            : {})
        }
      : contextWithManualReview

    try {
      const result = await request({
        method: RpcMethod.ETH_SEND_TRANSACTION,
        params: [toHexTx(tx)],
        chainId: getEvmCaip2ChainId(Number(chainId)),
        context: requestContext
      })

      return result as `0x${string}`
    } catch (err) {
      Logger.error('[fusion::evmSigner.sign]', err)
      throw err
    }
  }

  const sign: EvmSignerWithMessage['sign'] = (tx, _, stepDetails) =>
    signOne(tx, stepDetails, {})

  // Best-effort: errors are swallowed so the next signOne can surface
  // the real revert if the previous tx truly didn't land.
  const maybeWaitForReceipt = async (
    chainId: bigint | string,
    hash: `0x${string}`
  ): Promise<void> => {
    if (!waitForReceipt) return
    try {
      await waitForReceipt(Number(chainId), hash)
    } catch (err) {
      Logger.warn(
        '[fusion::evmSigner.signEachManually] receipt wait failed; continuing',
        err
      )
    }
  }

  const signEachManually = async (
    transactions: readonly Parameters<EvmSignerWithMessage['sign']>[0][],
    stepDetails: Parameters<EvmSignerWithMessage['sign']>[2],
    manualReviewReason?: string
  ): Promise<`0x${string}`[]> => {
    const hashes: `0x${string}`[] = []
    // Wait between intermediate steps on every per-tx path. CP-14211
    // moved the approve/swap pair from Markr's SDK-internal individual-sign
    // branch (which awaited the receipt itself) onto our `signBatch`, so
    // the wait now has to live here for the non-atomic fallback too —
    // not just the manual-review fallback. Without this, the swap's
    // pre-broadcast estimateGas can race the approve's confirmation and
    // surface a false "Swap failed" toast (CP-14283).
    for (let i = 0; i < transactions.length; i++) {
      const tx = transactions[i]
      if (!tx) continue
      const isIntermediate = i < transactions.length - 1
      const hash = await signOne(tx, stepDetails, {
        manualReviewReason,
        isIntermediate
      })
      hashes.push(hash)
      if (isIntermediate) {
        await maybeWaitForReceipt(tx.chainId, hash)
      }
    }
    return hashes
  }

  return {
    sign,

    signMessage: async (
      data: {
        message: string
        address: `0x${string}`
        chainId: number
      },
      _,
      stepDetails
    ) => {
      const { message, address, chainId } = data
      assert(message, 'Invalid message signing request: missing "message"')
      assert(address, 'Invalid message signing request: missing "address"')

      try {
        const result = await request({
          method: RpcMethod.PERSONAL_SIGN,
          params: [`0x${hex.encode(utf8.decode(message))}`, address],
          chainId: getEvmCaip2ChainId(chainId),
          context: buildRequestContext(stepDetails)
        })

        return result as `0x${string}`
      } catch (err) {
        Logger.error('[fusion::evmSigner.signMessage]', err)
        throw err
      }
    },

    signBatch: async (transactions, dispatch, stepDetails) => {
      assert(transactions.length > 0, 'signBatch called with no transactions')
      const { isQuickSwapsActive, maxBuy, isBatchSigningSupported } =
        getBatchOptions()

      // Cold-start guard: every batch tx must have fees pre-filled.
      const allTxsHaveFees = transactions.every(
        tx => typeof tx.maxFeePerGas === 'bigint'
      )
      const isCrossChain = isCrossChainQuote(stepDetails.quote)
      // Recurring fills must never go through the Quick Swaps auto-approve
      // batch bypass — `dispatchAsBatch` attaches `SWAP_AUTO_APPROVE` and the
      // batch validator would let a recurring fill auto-approve silently
      // (creating a schedule + first fill without the user seeing the
      // recurring preview). Recurring instead dispatches a *manual* batch
      // (see `dispatchRecurringBatch`) that carries RECURRING_SWAP context
      // and no SWAP_AUTO_APPROVE, routing to the BatchApprovalScreen.
      const isRecurring = isRecurringTransferSignatureReason(
        stepDetails.currentSignatureReason
      )

      if (isRecurring) {
        if (!isBatchSigningSupported) {
          // HW / WalletConnect: cannot batch-sign. Throw so the SDK's
          // fallbackToDefaultOnBatchFailure re-issues each tx via the
          // single-tx path.
          throw new BatchSigningUnsupportedError('hardware-or-walletconnect')
        }
        assert(
          transactions.every(tx => typeof tx.maxFeePerGas === 'bigint'),
          'signBatch: recurring batch txs must have fees pre-filled'
        )
        return dispatchRecurringBatch(request, transactions, stepDetails)
      }

      // The `eth_sendTransactionBatch` handler rejects batches with
      // fewer than 2 txs (the EVM module's Zod schema requires
      // `tuple([fe, fe]).rest(fe)`). A 1-tx "batch" from Markr would
      // otherwise hit invalidParams and the swap would fail — fall back
      // to per-tx instead.
      if (
        !isQuickSwapsActive ||
        !allTxsHaveFees ||
        isCrossChain ||
        transactions.length < 2
      ) {
        return signEachManually([...transactions], stepDetails)
      }

      // A flagged Quick-Swaps batch is no longer handled here: the
      // ApprovalController's `evaluateBatchApproval` returns `{kind:'manual'}`
      // for a batch whose validator requires manual approval, opening the
      // BatchApprovalScreen — it does not throw the old
      // `quickSwapsManualReview` marker back to us. So there is no per-tx
      // fallback to run; real broadcast errors just propagate (the SDK
      // handles them). We still log for telemetry parity with the other
      // signer paths before rethrowing.
      try {
        return await dispatchAsBatch(request, transactions, {
          stepDetails,
          maxBuy
        })
      } catch (err) {
        Logger.error('[fusion::evmSigner.signBatch]', err)
        throw err
      }
    }
  }
}
