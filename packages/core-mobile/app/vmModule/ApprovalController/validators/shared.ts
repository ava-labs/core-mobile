import { z } from 'zod'
import { AlertType, type RpcRequest } from '@avalabs/vm-module-types'
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
// boundary means a malformed context (string instead of number,
// missing fields, etc.) fails loudly with a context_missing fallback
// instead of misbehaving inside validateSwapAmounts.
const swapAutoApproveContextSchema = z
  .object({
    maxBuy: z.enum(QUICK_SWAP_MAX_BUY_VALUES).optional(),
    srcTokenAddress: z.string().optional(),
    destTokenAddress: z.string().optional(),
    isSrcTokenNative: z.boolean().optional(),
    isDestTokenNative: z.boolean().optional(),
    slippage: z.number().optional(),
    minAmountOut: z.string().optional(),
    amountIn: z.string().optional(),
    partnerFeeBps: z.number().optional()
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
