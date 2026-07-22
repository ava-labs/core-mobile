import {
  extractCancelError,
  extractOrderError,
  isApiError,
  isOrderError,
  isPerpsError,
  isPerpsUserRejection,
  isResponseValidationError,
  type BuilderInfo,
  type ExchangeCancelResponse,
  type ExchangePlaceOrderResponse,
  type OrderErrorContext,
  type PerpsManager
} from '@avalabs/perps-sdk'
import { showSnackbar } from 'common/utils/toast'
import Logger from 'utils/Logger'

/** Sentry tag applied to every perps failure so they can be filtered/grouped. */
const PERPS_ERROR_TAGS = { feature: 'perps' } as const

/** Extract the diagnostically useful fields of an HL / SDK error (many live on
 * non-enumerable properties that a plain console/Sentry dump would drop). */
const hyperliquidErrorFields = (error: unknown): unknown => {
  if (isApiError(error)) {
    return {
      name: error.name,
      message: error.message,
      status: error.status,
      responseBody: error.responseBody,
      details: error.options?.details
    }
  }
  if (isOrderError(error)) {
    return {
      name: error.name,
      message: error.message,
      exchangeResponse: error.exchangeResponse
    }
  }
  if (isResponseValidationError(error)) {
    return {
      name: error.name,
      message: error.message,
      issues: error.issues,
      rawResponse: error.rawResponse
    }
  }
  if (isPerpsError(error)) {
    return {
      name: error.name,
      message: error.message,
      code: error.code,
      details: error.options?.details,
      cause:
        error.options?.cause instanceof Error
          ? error.options.cause.message
          : error.options?.cause
    }
  }
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack }
  }
  return error
}

/**
 * Record an HL / SDK error from a failure path. Writes to two sinks because
 * they serve different purposes:
 *  - `Logger.info` — the verbose, human-readable dev dump. `Logger.error` routes
 *    through `console.groupCollapsed`, which Metro hides, so the readable copy
 *    has to go through `info`.
 *  - `Logger.error` — the ONLY level forwarded to Sentry, and the only one that
 *    survives production's ERROR log level. Without it these real-money failures
 *    (order / close / cancel rejects, TP/SL failures, submit throws, agent
 *    approval) leave zero server-side telemetry to debug from. Skipped for user
 *    rejections, which are deliberate cancellations, not errors worth alerting.
 */
export const logHyperliquidError = (label: string, error: unknown): void => {
  let payload: unknown
  try {
    payload = JSON.parse(JSON.stringify(hyperliquidErrorFields(error)))
  } catch {
    payload = String(error)
  }
  Logger.info(label, payload)
  if (!isPerpsUserRejection(error)) {
    Logger.error(label, payload, PERPS_ERROR_TAGS)
  }
}

/**
 * Record a Hyperliquid business rejection (order / cancel refused via the
 * response, as opposed to a thrown error). Same dual-sink rationale as
 * {@link logHyperliquidError}: readable `info` dump for dev, `error` for Sentry
 * + production so the reject is actually diagnosable.
 */
export const logHyperliquidReject = (
  label: string,
  detail: Record<string, unknown>
): void => {
  Logger.info(label, detail)
  Logger.error(label, detail, PERPS_ERROR_TAGS)
}

/** Slippage tolerance applied to market orders (5%). */
export const DEFAULT_SLIPPAGE = 0.05

export type PerpsOrderKind = 'market' | 'limit'

export type PlacePerpsOrderParams = {
  coin: string
  isLong: boolean
  /** Size in coin units (contracts). */
  sizeContracts: number
  orderKind: PerpsOrderKind
  /** Required when `orderKind` is `limit`. */
  limitPx?: number
  takeProfitPx?: number
  stopLossPx?: number
  /**
   * Optional builder fee (Core's revenue) charged on each fill. Omit to place
   * the order without a builder code (e.g. while Markr info is still loading).
   */
  builder?: BuilderInfo
}

/**
 * Dispatch to the right manager primitive based on order kind + TP/SL intent:
 * `placeOrderWithTpSl` when TP or SL is set, else `limitOrder` / `marketOrder`.
 */
export const placePerpsOrder = (
  manager: PerpsManager,
  params: PlacePerpsOrderParams
): Promise<ExchangePlaceOrderResponse> => {
  const { coin, isLong, sizeContracts, orderKind, limitPx, builder } = params
  const hasTpSl =
    params.takeProfitPx !== undefined || params.stopLossPx !== undefined

  if (hasTpSl) {
    return manager.placeOrderWithTpSl({
      coin,
      isBuy: isLong,
      sz: sizeContracts,
      entry:
        orderKind === 'market'
          ? { kind: 'market', slippage: DEFAULT_SLIPPAGE }
          : { kind: 'limit', limitPx: limitPx as number, tif: 'Gtc' },
      takeProfitPx: params.takeProfitPx,
      stopLossPx: params.stopLossPx,
      builder
    })
  }

  if (orderKind === 'limit') {
    return manager.limitOrder({
      coin,
      isBuy: isLong,
      limitPx: limitPx as number,
      sz: sizeContracts,
      reduceOnly: false,
      tif: 'Gtc',
      builder
    })
  }

  return manager.marketOrder({
    coin,
    isBuy: isLong,
    sz: sizeContracts,
    slippage: DEFAULT_SLIPPAGE,
    reduceOnly: false,
    builder
  })
}

/** True when the manager exists and has a signer-backed exchange client. */
export const isManagerTradable = (
  manager: PerpsManager | null
): manager is PerpsManager => manager !== null && manager.exchange !== undefined

/** Build the order-error context (asset index -> coin) from a manager. */
export const orderErrorContext = (
  manager: PerpsManager | null
): OrderErrorContext => ({
  assetToCoin:
    manager !== null ? (index: number) => manager.assetToCoin(index) : undefined
})

/**
 * Inspect a place-order response: toast + return false on a Hyperliquid order
 * error, otherwise toast success, run the refresh callback, and return true.
 */
export const finalizeOrderResult = (
  res: ExchangePlaceOrderResponse,
  errCtx: OrderErrorContext,
  successMessage: string,
  onSuccess: () => void
): boolean => {
  Logger.info('[perps] HL placeOrder response', res)
  const orderErr = extractOrderError(res, errCtx)
  if (orderErr !== undefined) {
    logHyperliquidReject('[perps] HL placeOrder rejected', {
      orderErr,
      response: res
    })
    showSnackbar(orderErr)
    return false
  }
  showSnackbar(successMessage)
  onSuccess()
  return true
}

/** Log + toast an order failure, suppressing the toast on user rejection. */
export const reportOrderError = (error: unknown, fallback: string): void => {
  logHyperliquidError('[perps] order error', error)
  if (!isPerpsUserRejection(error)) {
    showSnackbar(error instanceof Error ? error.message : fallback)
  }
}

/** Inspect a cancel response: toast + return false on error, else success. */
export const finalizeCancelResult = (
  res: ExchangeCancelResponse,
  errCtx: OrderErrorContext,
  successMessage: string,
  onSuccess: () => void
): boolean => {
  Logger.info('[perps] HL cancel response', res)
  const cancelErr = extractCancelError(res, errCtx)
  if (cancelErr !== undefined) {
    logHyperliquidReject('[perps] HL cancel rejected', {
      cancelErr,
      response: res
    })
    showSnackbar(cancelErr)
    return false
  }
  showSnackbar(successMessage)
  onSuccess()
  return true
}
