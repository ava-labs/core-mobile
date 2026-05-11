import { AlertType, type RpcRequest } from '@avalabs/vm-module-types'
import { isInAppRequest } from 'store/rpc/utils/isInAppRequest'
import { WalletType } from 'services/wallet/types'
import {
  RequestContext,
  RpcMethod,
  type SwapAutoApproveContext
} from 'store/rpc/types'
import {
  validateSwapAmounts,
  type ValidationFailReason
} from 'features/swap/utils/swapValidation'
import AnalyticsService from 'services/analytics/AnalyticsService'
import Logger from 'utils/Logger'
import type { BalanceChangeData } from 'features/swap/utils/swapValidation'
import type {
  RequestValidationParams,
  RequestValidator,
  ValidationResult
} from './types'

// Allowlist (not denylist): future wallet types fail-safe — they must be
// explicitly added here to become eligible. Also fails closed when
// walletType is missing from context (denylist would fail open).
const SOFTWARE_WALLET_TYPES: ReadonlySet<WalletType> = new Set([
  WalletType.MNEMONIC,
  WalletType.SEEDLESS,
  WalletType.PRIVATE_KEY
])

type BypassFallbackReason =
  | 'context_missing'
  | 'tx_flagged_warning'
  | 'tx_flagged_malicious'
  | 'unknown'
  | ValidationFailReason

const readAutoApproveContext = (
  request: RpcRequest
): SwapAutoApproveContext | undefined => {
  const ctx = request.context as Record<string, unknown> | undefined
  if (!ctx) return undefined
  const value = ctx[RequestContext.SWAP_AUTO_APPROVE]
  if (
    value !== null &&
    typeof value === 'object' &&
    typeof (value as { autoApprove?: unknown }).autoApprove === 'boolean'
  ) {
    return value as SwapAutoApproveContext
  }
  return undefined
}

const readWalletType = (request: RpcRequest): WalletType | undefined => {
  const ctx = request.context as Record<string, unknown> | undefined
  const wt = ctx?.walletType
  if (
    typeof wt === 'string' &&
    Object.values(WalletType).includes(wt as WalletType)
  ) {
    return wt as WalletType
  }
  return undefined
}

const fallback = (
  reason: string,
  code: BypassFallbackReason
): ValidationResult => ({
  isValid: false,
  requiresManualApproval: true,
  reason,
  code: code as ValidationFailReason
})

const hardReject = (
  reason: string,
  code: BypassFallbackReason
): ValidationResult => ({
  isValid: false,
  requiresManualApproval: false,
  reason,
  code: code as ValidationFailReason
})

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
  reason: BypassFallbackReason,
  requiresManualApproval: boolean
): void => {
  AnalyticsService.capture('QuickSwapsBypassFellBack', {
    caip2SourceChainId: request.chainId,
    reason,
    requiresManualApproval
  })
}

// Both Danger and Warning fall through to the manual modal — matches
// `core-extension`. The modal renders the alert banner inline (with
// Blockaid's "Scam transaction" / "Proceed Anyway" buttons) so the
// user sees the warning and chooses. Hard-rejecting would surface a
// confusing error toast with no path to proceed.
const interpretAlert = (
  alert: RequestValidationParams['displayData']['alert']
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

const runValidation = async (
  params: RequestValidationParams
): Promise<ValidationResult> => {
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
      isSwapFeesEnabled: ctx.isSwapFeesEnabled ?? false
    }
  })
}

// Trust boundary: isInAppRequest gate prevents external dApps from
// triggering the bypass even if their context shape matches.
export const swapValidator: RequestValidator = {
  canHandle: (params: RequestValidationParams): boolean => {
    if (!isInAppRequest(params.request)) return false
    if ((params.signingData?.type as string) !== RpcMethod.ETH_SEND_TRANSACTION)
      return false
    const ctx = readAutoApproveContext(params.request)
    if (!ctx?.autoApprove) return false
    const walletType = readWalletType(params.request)
    return walletType !== undefined && SOFTWARE_WALLET_TYPES.has(walletType)
  },

  validate: async (
    params: RequestValidationParams
  ): Promise<ValidationResult> => {
    let result: ValidationResult
    try {
      result = await runValidation(params)
    } catch (err) {
      Logger.warn('[SwapValidator] validation failed; falling back', err)
      result = fallback('Transaction safety check failed', 'unknown')
    }

    if (result.isValid) {
      const ctx = readAutoApproveContext(params.request)
      if (ctx) captureFired(params.request, ctx)
    } else {
      Logger.info('[SwapValidator] fell back to manual', {
        code: result.code,
        reason: result.reason,
        requiresManualApproval: result.requiresManualApproval
      })
      captureFellBack(
        params.request,
        (result.code as BypassFallbackReason | undefined) ?? 'unknown',
        result.requiresManualApproval
      )
    }

    return result
  }
}
