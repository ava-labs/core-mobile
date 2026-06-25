import { z } from 'zod'
import { AlertType, type RpcRequest } from '@avalabs/vm-module-types'
import {
  RECURRING_FREQUENCY_UNITS,
  RECURRING_FREQUENCY_VALUE_MAX,
  TransferSignatureReason
} from '@avalabs/fusion-sdk'
import { isInAppRequest } from 'store/rpc/utils/isInAppRequest'
import { WalletType } from 'services/wallet/types'
import { RequestContext, type SwapAutoApproveContext } from 'store/rpc/types'
import {
  QUICK_SWAP_MAX_BUY_VALUES,
  QUICK_SWAPS_SOFTWARE_WALLET_TYPES
} from 'store/settings/advanced/types'
import {
  validateSwapAmounts,
  type BalanceChangeData,
  type ValidationFailReason,
  type ValidationResult
} from 'features/swap/utils/swapValidation'
import AnalyticsService from 'services/analytics/AnalyticsService'
import Logger from 'utils/Logger'

// Schema mirrors SwapAutoApproveContext. Validating at the validator
// boundary means a malformed context (string instead of number, out
// of range, etc.) fails loudly with a context_missing fallback
// instead of misbehaving inside validateSwapAmounts.
//
// Range bounds on slippage/partnerFeeBps prevent a malformed quote
// from producing `slippagePercent + feePercent >= 1`, which would
// negate the loss-tolerance check.
const BPS_MAX = 10_000
const swapAutoApproveContextSchema = z
  .object({
    maxBuy: z.enum(QUICK_SWAP_MAX_BUY_VALUES).optional(),
    srcTokenAddress: z.string().optional(),
    destTokenAddress: z.string().optional(),
    isSrcTokenNative: z.boolean().optional(),
    isDestTokenNative: z.boolean().optional(),
    slippage: z.number().min(0).max(BPS_MAX).optional(),
    minAmountOut: z.string().optional(),
    amountIn: z.string().optional(),
    partnerFeeBps: z.number().min(0).max(BPS_MAX).optional()
  })
  .strict()

const readCtx = (request: RpcRequest): Record<string, unknown> | undefined =>
  request.context as Record<string, unknown> | undefined

const readAutoApproveContext = (
  request: RpcRequest
): SwapAutoApproveContext | undefined => {
  const value = readCtx(request)?.[RequestContext.SWAP_AUTO_APPROVE]
  if (value === null || typeof value !== 'object') return undefined
  const parsed = swapAutoApproveContextSchema.safeParse(value)
  if (!parsed.success) {
    Logger.error(
      '[shared.readAutoApproveContext] malformed SWAP_AUTO_APPROVE context',
      parsed.error
    )
    return undefined
  }
  return parsed.data
}

// Slim schema for the display-only recurring-swap context that EvmSigner
// (`features/swap/services/signers/EvmSigner.ts`) injects onto an
// ApprovalController request when the SDK's synthetic Quote carries a
// `markr-recurring*` aggregator id. Strict zod validation at
// the read boundary — a malformed snapshot throws so the caller can block
// the approval rather than silently presenting a recurring schedule as a
// one-shot swap.
const recurringFrequencySchema = z
  .object({
    // Source the enum from the SDK's exported const so a new wire-level
    // unit added upstream is automatically accepted by the validator
    // (avoids the silent drift bug of hand-mirroring the literal tuple).
    unit: z.enum(RECURRING_FREQUENCY_UNITS),
    value: z.number().int().min(1).max(RECURRING_FREQUENCY_VALUE_MAX)
  })
  .strict()

// Wire sentinel the fusion-sdk's quote normalizer emits for "Unlimited"
// schedules: see `markrRecurringQuote` in `@avalabs/fusion-sdk` —
// `Infinity` (UI sentinel) is translated to `-1` before POST /recurring/quote,
// and the response schema (`RecurringQuoteResponseSchema.numberOfOrders` =
// `z.number().int()`) echoes it back unchanged. So `quote.numberOfOrders`
// is `-1` on unlimited responses, which `submitRecurringSwap` forwards
// verbatim into this side-channel context.
const UNLIMITED_NUMBER_OF_ORDERS_WIRE_SENTINEL = -1

const recurringFillContextSchema = z
  .object({
    fromTokenSymbol: z.string().min(1),
    toTokenSymbol: z.string().min(1),
    amountPerOrderFormatted: z.string().min(1),
    // Either the wire sentinel for unlimited schedules (`-1`) or a finite
    // count in `[2, RECURRING_FREQUENCY_VALUE_MAX]`. Markr's documented floor
    // for finite schedules is 2 (a "1-order schedule" is just a one-shot
    // swap) — matches the picker's `MIN_ORDERS = 2`. "Unlimited?" is
    // derived from this sentinel everywhere downstream — no separate
    // boolean field, so the two can never disagree.
    numberOfOrders: z
      .number()
      .int()
      .refine(
        v =>
          v === UNLIMITED_NUMBER_OF_ORDERS_WIRE_SENTINEL ||
          (v >= 2 && v <= RECURRING_FREQUENCY_VALUE_MAX),
        {
          message: `numberOfOrders must be ${UNLIMITED_NUMBER_OF_ORDERS_WIRE_SENTINEL} (unlimited sentinel) or in [2, ${RECURRING_FREQUENCY_VALUE_MAX}]`
        }
      ),
    frequency: recurringFrequencySchema
  })
  .strict()

const recurringOrderActionContextSchema = z
  .object({
    // Producer (`_makeOrderActionHook`) sets this from its own
    // `config.type` — the SDK's `TransferSignatureReason` enum value
    // for the action being signed. Not a tagged-union discriminator
    // anymore (the union is structural — fills carry `frequency`,
    // order actions don't); just the carrier the approval modal uses
    // to pick cancel/pause/resume copy. The SDK's
    // `currentSignatureReason` lives on `stepDetails` and isn't
    // reachable from the approval screen, so the producer is the
    // simplest source.
    action: z.enum([
      TransferSignatureReason.CancelRecurringSwap,
      TransferSignatureReason.PauseRecurringSwap,
      TransferSignatureReason.ResumeRecurringSwap
    ]),
    fromTokenSymbol: z.string().min(1),
    toTokenSymbol: z.string().min(1)
  })
  .strict()

// Structural union (not `discriminatedUnion`) — the two branches no longer
// carry a `type` discriminator. With `.strict()` on both branches the
// shapes are disjoint (fill requires `frequency`/`numberOfOrders`/
// `amountPerOrderFormatted`, all of which order-action rejects as unknown
// fields), so each payload still matches exactly one branch at parse
// time. Downstream code discriminates fill vs order-action structurally
// (presence of `frequency`).
export const recurringSwapApprovalContextSchema = z.union([
  recurringFillContextSchema,
  recurringOrderActionContextSchema
])

export type RecurringSwapApprovalContext = z.infer<
  typeof recurringSwapApprovalContextSchema
>

// Thrown by `readRecurringSwapApprovalContext` when the request carries
// a RECURRING_SWAP context that fails schema validation. The producer
// (EvmSigner.signOne) is internal mobile code, so this signals a mobile
// bug — but if it slips through, callers MUST refuse to render the
// approval rather than degrading to a generic-swap UI.
export class MalformedRecurringSwapContextError extends Error {
  readonly zodError: z.ZodError
  constructor(zodError: z.ZodError) {
    super('Malformed RECURRING_SWAP context')
    this.name = 'MalformedRecurringSwapContextError'
    this.zodError = zodError
  }
}

export const readRecurringSwapApprovalContext = (
  request: RpcRequest
): RecurringSwapApprovalContext | undefined => {
  const value = readCtx(request)?.[RequestContext.RECURRING_SWAP]
  // Only nullish counts as "absent". A non-nullish non-object (string,
  // number, boolean, array, …) is a malformed snapshot from the producer
  // and MUST flow into Zod so the parse fails loudly — silently dropping
  // it would hide the RecurrenceDetails preview while the underlying
  // recurring swap still executes.
  if (value === null || value === undefined) {
    return undefined
  }
  const parsed = recurringSwapApprovalContextSchema.safeParse(value)
  if (!parsed.success) {
    Logger.error(
      '[shared.readRecurringSwapApprovalContext] malformed RECURRING_SWAP context',
      parsed.error
    )
    throw new MalformedRecurringSwapContextError(parsed.error)
  }
  return parsed.data
}

const readWalletType = (request: RpcRequest): WalletType | undefined => {
  const wt = readCtx(request)?.walletType
  if (
    typeof wt === 'string' &&
    Object.values(WalletType).includes(wt as WalletType)
  ) {
    return wt as WalletType
  }
  return undefined
}

// Reads the PostHog kill-switch snapshot injected into in-app
// requests by handleRequestViaVMModule / eth_sendTransactionBatch.
// Defense-in-depth: the signer is the primary gate, but re-checking
// here means a stale SWAP_AUTO_APPROVE context (e.g. from a code path
// that didn't go through the live-state-aware signer) still refuses
// bypass after the flag flips off.
const isQuickSwapsAvailable = (request: RpcRequest): boolean =>
  readCtx(request)?.[RequestContext.QUICK_SWAPS_AVAILABLE] === true

// Trust boundary: isInAppRequest gate prevents external dApps from
// triggering the bypass even if their context shape matches. Method
// check stays with each validator since it differs between single-tx
// and batch.
export const isBypassEligible = (request: RpcRequest): boolean => {
  if (!isInAppRequest(request)) return false
  if (!isQuickSwapsAvailable(request)) return false
  if (!readAutoApproveContext(request)) return false
  const walletType = readWalletType(request)
  return (
    walletType !== undefined &&
    QUICK_SWAPS_SOFTWARE_WALLET_TYPES.has(walletType)
  )
}

const fallback = (
  reason: string,
  code: ValidationFailReason
): ValidationResult => ({
  isValid: false,
  requiresManualApproval: true,
  reason,
  code
})

const hardReject = (
  reason: string,
  code: ValidationFailReason
): ValidationResult => ({
  isValid: false,
  requiresManualApproval: false,
  reason,
  code
})

// Minimal structural type — single-tx and batch displayData both expose
// these three fields with identical shapes.
type DisplayDataLike = {
  alert?: {
    type: AlertType
    details?: { title?: string; description?: string }
  }
  isSimulationSuccessful?: boolean
  balanceChange?: unknown
}

// Both Danger and Warning fall through to the manual modal — matches
// `core-extension`. The modal renders the alert banner inline (with
// Blockaid's "Scam transaction" / "Proceed Anyway" buttons) so the
// user sees the warning and chooses. Hard-rejecting would surface a
// confusing error toast with no path to proceed.
const interpretAlert = (
  alert: DisplayDataLike['alert']
): ValidationResult | null => {
  if (!alert) return null
  if (alert.type === AlertType.DANGER) {
    return fallback(
      alert.details?.title || 'Transaction flagged as malicious',
      'tx_flagged_malicious'
    )
  }
  if (alert.type === AlertType.WARNING) {
    return fallback(
      alert.details?.title || 'Transaction safety check returned Warning',
      'tx_flagged_warning'
    )
  }
  return null
}

const runSwapValidation = async (params: {
  request: RpcRequest
  displayData: DisplayDataLike
}): Promise<ValidationResult> => {
  const { request, displayData } = params
  const ctx = readAutoApproveContext(request)
  if (!ctx) {
    return fallback('Quick Swaps context not provided', 'context_missing')
  }

  const alertResult = interpretAlert(displayData.alert)
  if (alertResult) return alertResult

  if (displayData.isSimulationSuccessful === false) {
    return hardReject(
      'Transaction simulation failed - cannot safely auto-approve swap',
      'simulation_failed'
    )
  }

  return validateSwapAmounts({
    displayData: {
      isSimulationSuccessful: displayData.isSimulationSuccessful,
      // SDK BalanceChange and local BalanceChangeData are structurally
      // identical but nominally distinct — cast at the boundary.
      balanceChange: displayData.balanceChange as BalanceChangeData | undefined
    },
    context: {
      srcTokenAddress: ctx.srcTokenAddress,
      destTokenAddress: ctx.destTokenAddress,
      isSrcTokenNative: ctx.isSrcTokenNative ?? false,
      isDestTokenNative: ctx.isDestTokenNative ?? false,
      slippage: ctx.slippage,
      minAmountOut: ctx.minAmountOut,
      amountIn: ctx.amountIn,
      maxBuy: ctx.maxBuy,
      partnerFeeBps: ctx.partnerFeeBps
    }
  })
}

const captureFired = (
  request: RpcRequest,
  ctx: SwapAutoApproveContext
): void => {
  AnalyticsService.capture('QuickSwapsBypassFired', {
    caip2SourceChainId: request.chainId,
    maxBuy: ctx.maxBuy ?? 'unlimited'
  })
}

const captureFellBack = (
  request: RpcRequest,
  reason: ValidationFailReason,
  requiresManualApproval: boolean
): void => {
  AnalyticsService.capture('QuickSwapsBypassFellBack', {
    caip2SourceChainId: request.chainId,
    reason,
    requiresManualApproval
  })
}

// Wraps validation with try/catch and analytics. Single-tx and batch
// validators share this whole flow — only canHandle (method check)
// differs.
export const runValidateAndCapture = async (params: {
  request: RpcRequest
  displayData: DisplayDataLike
  loggerTag: string
}): Promise<ValidationResult> => {
  let result: ValidationResult
  try {
    result = await runSwapValidation(params)
  } catch (err) {
    // Logger.error pipes to Sentry — an unexpected validation throw
    // is a real bug (validateSwapAmounts contract violation, etc.),
    // not a routine fallback path.
    Logger.error(`${params.loggerTag} validation threw; falling back`, err)
    result = fallback('Transaction safety check failed', 'unknown')
  }

  if (result.isValid) {
    const ctx = readAutoApproveContext(params.request)
    if (ctx) captureFired(params.request, ctx)
  } else {
    // Logger.info, not warn — warn wraps in console.groupCollapsed
    // which Metro swallows.
    Logger.info(`${params.loggerTag} fell back to manual`, {
      code: result.code,
      reason: result.reason,
      requiresManualApproval: result.requiresManualApproval
    })
    captureFellBack(
      params.request,
      result.code ?? 'unknown',
      result.requiresManualApproval
    )
  }

  return result
}
