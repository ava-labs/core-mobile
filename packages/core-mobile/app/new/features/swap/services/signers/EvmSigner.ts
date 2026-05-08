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
import { buildRequestContext } from '../../utils/buildRequestContext'

// Getter (not captured value) so the signer reads the latest settings
// even if the user toggles Quick Swaps between init and execution.
export type SignBatchOptionsGetter = () => {
  isQuickSwapsActive: boolean
  maxBuy: QuickSwapMaxBuy
}

const normalizeBatchTx = (
  tx: EvmTransactionRequest
): Record<string, unknown> => ({
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
  ...(tx.nonce !== undefined ? { nonce: tx.nonce } : {}),
  ...(tx.type !== undefined && tx.type !== null ? { type: tx.type } : {})
})

// Approves shouldn't bypass: Blockaid's assets_diffs is empty for
// approves (allowance changes live in exposures, not balances) — the
// validator would hit balance_change_missing. Plus, the spend-limit
// modal is a security affordance worth preserving on Quick Swaps too.
const ERC20_APPROVE_SELECTOR = '0x095ea7b3'

const isApproveTx = (data: string | null | undefined): boolean =>
  typeof data === 'string' &&
  data.toLowerCase().startsWith(ERC20_APPROVE_SELECTOR)

// Cross-chain bypass is structurally unverifiable: Blockaid simulation is
// single-chain so the validator can't confirm destination-side delivery.
// Skip the bypass attempt rather than letting the validator fall back via
// balance_change_missing (cleaner telemetry, fewer noise events). Matches
// core-extension's upstream gate.
const isCrossChainQuote = (quote: Quote): boolean =>
  quote.sourceChain.chainId !== quote.targetChain.chainId

const isQuickSwapsManualReviewError = (err: unknown): boolean => {
  if (!err || typeof err !== 'object') return false
  const data = (err as { data?: unknown }).data
  if (!data || typeof data !== 'object') return false
  return (
    (data as { quickSwapsManualReview?: unknown }).quickSwapsManualReview ===
    true
  )
}

const getChainIdForBatch = (
  transactions: readonly EvmTransactionRequest[]
): number => {
  const first = transactions[0]
  assert(first, 'signBatch called with empty transactions array')
  return Number(first.chainId)
}

const BASIS_POINTS_DIVISOR = 10_000n

// minAmountOut nets out included fees: Markr deducts fees with
// fundingModel='included' from amountOut before the user receives
// anything, so the on-chain minOut must be enforced against the net.
// Computing from the gross would systematically reject small swaps.
const buildAutoApproveContext = (
  quote: Quote,
  isQuickSwapsActive: boolean,
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
    (netAmountOut * (BASIS_POINTS_DIVISOR - slippageBpsBigInt)) /
    BASIS_POINTS_DIVISOR

  return {
    autoApprove: isQuickSwapsActive,
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
    isSwapFeesEnabled:
      partnerFeeBps !== null && partnerFeeBps !== undefined && partnerFeeBps > 0
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
        true,
        maxBuy
      )
    }
  })
  return result as unknown as readonly `0x${string}`[]
}

export function createEvmSigner(
  request: Request,
  getBatchOptions: SignBatchOptionsGetter
): EvmSignerWithMessage {
  const sign: EvmSignerWithMessage['sign'] = async (tx, _, stepDetails) => {
    const { from, data, to, value, chainId } = tx
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
    const shouldAttachAutoApprove =
      isQuickSwapsActive &&
      stepDetails.quote.serviceType === ServiceType.MARKR &&
      !isApprove &&
      hasUpstreamFees &&
      !isCrossChainQuote(stepDetails.quote)
    const baseContext = buildRequestContext(stepDetails)
    const requestContext = shouldAttachAutoApprove
      ? {
          ...baseContext,
          [RequestContext.SWAP_AUTO_APPROVE]: buildAutoApproveContext(
            stepDetails.quote,
            true,
            maxBuy
          )
        }
      : baseContext

    try {
      const result = await request({
        method: RpcMethod.ETH_SEND_TRANSACTION,
        params: [
          {
            from,
            to,
            data,
            value: typeof value === 'bigint' ? bigIntToHex(value) : undefined,
            chainId,
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
          }
        ],
        chainId: getEvmCaip2ChainId(Number(chainId)),
        context: requestContext
      })

      return result as `0x${string}`
    } catch (err) {
      Logger.error('[fusion::evmSigner.sign]', err)
      throw err
    }
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
      const { isQuickSwapsActive, maxBuy } = getBatchOptions()

      const signEachManually = async (): Promise<`0x${string}`[]> => {
        const hashes: `0x${string}`[] = []
        for (const tx of transactions) {
          hashes.push(await sign(tx, dispatch, stepDetails))
        }
        return hashes
      }

      // Cold-start guard: every batch tx must have fees pre-filled.
      const allTxsHaveFees = transactions.every(
        tx => typeof tx.maxFeePerGas === 'bigint'
      )
      const isCrossChain = isCrossChainQuote(stepDetails.quote)
      if (!isQuickSwapsActive || !allTxsHaveFees || isCrossChain) {
        return signEachManually()
      }

      try {
        return await dispatchAsBatch(request, transactions, {
          stepDetails,
          maxBuy
        })
      } catch (err) {
        if (isQuickSwapsManualReviewError(err)) {
          Logger.info(
            '[fusion::evmSigner.signBatch] bypass requires manual review; falling back to per-tx approval',
            (err as { data?: unknown }).data
          )
          return signEachManually()
        }
        Logger.error('[fusion::evmSigner.signBatch]', err)
        throw err
      }
    }
  }
}
