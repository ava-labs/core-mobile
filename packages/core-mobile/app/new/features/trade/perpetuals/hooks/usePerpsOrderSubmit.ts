import { showSnackbar } from 'common/utils/toast'
import { useCallback, useMemo, useState } from 'react'
import Logger from 'utils/Logger'
import { usePerps } from '../contexts/PerpsProvider'
import {
  finalizeOrderResult,
  isManagerTradable,
  logHyperliquidError,
  orderErrorContext,
  placePerpsOrder,
  reportOrderError,
  type PerpsOrderKind
} from '../utils/orderExecution'
import { useClearLoadingOnPerpsReconnect } from './useClearLoadingOnPerpsReconnect'
import { usePerpsBuilderFee } from './usePerpsBuilderFee'

export type SubmitOrderParams = {
  coin: string
  isLong: boolean
  /** Order size in coin units (contracts). */
  sizeContracts: number
  leverage: number
  orderKind: PerpsOrderKind
  /** Required when `orderKind` is `limit`. */
  limitPx?: number
  takeProfitPx?: number
  stopLossPx?: number
}

/**
 * Perps order submission: sets leverage then places a market or limit order,
 * optionally with attached take-profit / stop-loss (`placeOrderWithTpSl`).
 * Maps Hyperliquid error payloads to toasts and triggers the shared post-trade
 * balance refresh. Requires a signer-backed manager (agent key or fallback).
 */
export const usePerpsOrderSubmit = (): {
  submitting: boolean
  submitOrder: (params: SubmitOrderParams) => Promise<boolean>
} => {
  const { manager, ready, refreshAfterTrade } = usePerps()
  // Only attach a builder code once the master has approved that fee on HL.
  // Attaching an unapproved fee makes HL reject the order.
  const { builderInfo, isApproved: isBuilderFeeApproved } = usePerpsBuilderFee()
  const [submitting, setSubmitting] = useState(false)
  const errCtx = useMemo(() => orderErrorContext(manager), [manager])
  // Drop the in-flight guard if the socket drops mid-submit so the button
  // recovers instead of staying stuck in its loading state.
  useClearLoadingOnPerpsReconnect(useCallback(() => setSubmitting(false), []))

  const submitOrder = useCallback(
    async (params: SubmitOrderParams): Promise<boolean> => {
      const { coin, sizeContracts, leverage, orderKind, limitPx } = params
      if (!ready || !isManagerTradable(manager)) {
        showSnackbar('Trading is still connecting — try again in a moment')
        return false
      }
      if (!Number.isFinite(sizeContracts) || sizeContracts <= 0) {
        showSnackbar('Enter a valid amount')
        return false
      }
      if (
        orderKind === 'limit' &&
        (limitPx === undefined || !Number.isFinite(limitPx) || limitPx <= 0)
      ) {
        showSnackbar('Enter a valid limit price')
        return false
      }

      setSubmitting(true)
      const builder = isBuilderFeeApproved ? builderInfo : undefined
      // Leverage is committed to Hyperliquid up-front from the leverage screen
      // (`PerpetualsLeverageScreen`), so the order path only places the order —
      // this avoids a redundant `updateLeverage` that HL rejects when it would
      // decrease leverage on an existing position.
      Logger.info('[perps] submitOrder start', {
        coin,
        sizeContracts,
        leverage,
        orderKind,
        limitPx,
        isLong: params.isLong,
        builder
      })
      try {
        Logger.info('[perps] placeOrder calling…')
        const res = await placePerpsOrder(manager, {
          ...params,
          builder
        })
        return finalizeOrderResult(
          res,
          errCtx,
          'Order submitted',
          refreshAfterTrade
        )
      } catch (e) {
        logHyperliquidError('[perps] submitOrder threw', e)
        reportOrderError(e, 'Order failed')
        return false
      } finally {
        setSubmitting(false)
      }
    },
    [
      manager,
      ready,
      errCtx,
      refreshAfterTrade,
      builderInfo,
      isBuilderFeeApproved
    ]
  )

  return { submitting, submitOrder }
}
