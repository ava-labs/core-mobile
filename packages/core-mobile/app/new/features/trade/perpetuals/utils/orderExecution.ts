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

/** Dump HL / SDK error fields that `Logger.error(msg, err)` often collapses. */
export const logHyperliquidError = (label: string, error: unknown): void => {
  // Prefer Logger.info — Logger.error uses console.groupCollapsed and Metro
  // hides the dump, so failures looked like "no log after submitOrder start".
  const dump = (payload: unknown): void => {
    try {
      Logger.info(label, JSON.parse(JSON.stringify(payload)))
    } catch {
      Logger.info(label, String(payload))
    }
  }

  if (isApiError(error)) {
    dump({
      name: error.name,
      message: error.message,
      status: error.status,
      responseBody: error.responseBody,
      details: error.options?.details
    })
    return
  }
  if (isOrderError(error)) {
    dump({
      name: error.name,
      message: error.message,
      exchangeResponse: error.exchangeResponse
    })
    return
  }
  if (isResponseValidationError(error)) {
    dump({
      name: error.name,
      message: error.message,
      issues: error.issues,
      rawResponse: error.rawResponse
    })
    return
  }
  if (isPerpsError(error)) {
    dump({
      name: error.name,
      message: error.message,
      code: error.code,
      details: error.options?.details,
      cause:
        error.options?.cause instanceof Error
          ? error.options.cause.message
          : error.options?.cause
    })
    return
  }
  if (error instanceof Error) {
    dump({ name: error.name, message: error.message, stack: error.stack })
    return
  }
  dump(error)
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
    Logger.info('[perps] HL placeOrder rejected', {
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
    Logger.info('[perps] HL cancel rejected', { cancelErr, response: res })
    showSnackbar(cancelErr)
    return false
  }
  showSnackbar(successMessage)
  onSuccess()
  return true
}
