import { showSnackbar } from 'common/utils/toast'
import { useCallback, useMemo, useState } from 'react'
import { usePerps } from '../contexts/PerpsProvider'
import {
  DEFAULT_SLIPPAGE,
  finalizeCancelResult,
  finalizeOrderResult,
  isManagerTradable,
  orderErrorContext,
  reportOrderError
} from '../utils/orderExecution'
import { useClearLoadingOnPerpsReconnect } from './useClearLoadingOnPerpsReconnect'
import { usePerpsBuilderFee } from './usePerpsBuilderFee'

export type SetPositionTpSlParams = {
  coin: string
  /** Absolute position size (contracts) the TP/SL should reduce. */
  sizeContracts: number
  positionIsLong: boolean
  takeProfitPx?: number
  stopLossPx?: number
}

/**
 * Actions on an existing open position / order:
 * - market close (reduce-only) the full size,
 * - cancel a resting order,
 * - change leverage or isolated margin,
 * - attach/replace take-profit / stop-loss triggers.
 */
export const usePerpsPositionActions = (): {
  busy: boolean
  closePosition: (
    coin: string,
    szi: number,
    sizeContracts?: number
  ) => Promise<boolean>
  limitClose: (
    coin: string,
    szi: number,
    sizeContracts: number,
    limitPx: number
  ) => Promise<boolean>
  cancelOrder: (coin: string, oid: number) => Promise<boolean>
  updateLeverage: (
    coin: string,
    leverage: number,
    isCross: boolean
  ) => Promise<boolean>
  updateIsolatedMargin: (coin: string, usd: number) => Promise<boolean>
  setPositionTpSl: (params: SetPositionTpSlParams) => Promise<boolean>
} => {
  const { manager, refreshAfterTrade } = usePerps()
  // Core's revenue on each fill. Attached to reduce-only closes just like
  // opening orders; `undefined` while Markr info loads (never blocks a close).
  const { builderInfo } = usePerpsBuilderFee()
  const [busy, setBusy] = useState(false)
  const errCtx = useMemo(() => orderErrorContext(manager), [manager])
  useClearLoadingOnPerpsReconnect(useCallback(() => setBusy(false), []))

  const closePosition = useCallback(
    async (
      coin: string,
      szi: number,
      sizeContracts?: number
    ): Promise<boolean> => {
      if (!isManagerTradable(manager)) {
        showSnackbar('Connect a wallet to trade')
        return false
      }
      const size = Math.min(Math.abs(sizeContracts ?? szi), Math.abs(szi))
      if (size <= 0) {
        return false
      }
      setBusy(true)
      try {
        // Closing a long (szi > 0) sells; closing a short (szi < 0) buys.
        const res = await manager.marketOrder({
          coin,
          isBuy: szi < 0,
          sz: size,
          slippage: DEFAULT_SLIPPAGE,
          reduceOnly: true,
          builder: builderInfo
        })
        return finalizeOrderResult(
          res,
          errCtx,
          'Position closed',
          refreshAfterTrade
        )
      } catch (e) {
        reportOrderError(e, 'Failed to close position')
        return false
      } finally {
        setBusy(false)
      }
    },
    [manager, errCtx, refreshAfterTrade, builderInfo]
  )

  const limitClose = useCallback(
    async (
      coin: string,
      szi: number,
      sizeContracts: number,
      limitPx: number
    ): Promise<boolean> => {
      if (!isManagerTradable(manager)) {
        showSnackbar('Connect a wallet to trade')
        return false
      }
      const size = Math.min(Math.abs(sizeContracts), Math.abs(szi))
      if (size <= 0 || !Number.isFinite(limitPx) || limitPx <= 0) {
        showSnackbar('Enter a valid amount and price')
        return false
      }
      setBusy(true)
      try {
        const res = await manager.limitOrder({
          coin,
          isBuy: szi < 0,
          limitPx,
          sz: size,
          reduceOnly: true,
          tif: 'Gtc',
          builder: builderInfo
        })
        return finalizeOrderResult(
          res,
          errCtx,
          'Limit close placed',
          refreshAfterTrade
        )
      } catch (e) {
        reportOrderError(e, 'Failed to place limit close')
        return false
      } finally {
        setBusy(false)
      }
    },
    [manager, errCtx, refreshAfterTrade, builderInfo]
  )

  const cancelOrder = useCallback(
    async (coin: string, oid: number): Promise<boolean> => {
      if (!isManagerTradable(manager)) {
        showSnackbar('Connect a wallet to trade')
        return false
      }
      setBusy(true)
      try {
        const res = await manager.cancelOpenOrder({ coin, oid })
        return finalizeCancelResult(
          res,
          errCtx,
          'Order cancelled',
          refreshAfterTrade
        )
      } catch (e) {
        reportOrderError(e, 'Failed to cancel order')
        return false
      } finally {
        setBusy(false)
      }
    },
    [manager, errCtx, refreshAfterTrade]
  )

  const updateLeverage = useCallback(
    async (
      coin: string,
      leverage: number,
      isCross: boolean
    ): Promise<boolean> => {
      if (!isManagerTradable(manager)) {
        showSnackbar('Connect a wallet to trade')
        return false
      }
      setBusy(true)
      try {
        await manager.updateLeverage({ coin, leverage, isCross })
        showSnackbar('Leverage updated')
        refreshAfterTrade()
        return true
      } catch (e) {
        reportOrderError(e, 'Failed to update leverage')
        return false
      } finally {
        setBusy(false)
      }
    },
    [manager, refreshAfterTrade]
  )

  const updateIsolatedMargin = useCallback(
    async (coin: string, usd: number): Promise<boolean> => {
      if (!isManagerTradable(manager)) {
        showSnackbar('Connect a wallet to trade')
        return false
      }
      setBusy(true)
      try {
        await manager.updateIsolatedMargin({ coin, usd })
        showSnackbar('Margin updated')
        refreshAfterTrade()
        return true
      } catch (e) {
        reportOrderError(e, 'Failed to update margin')
        return false
      } finally {
        setBusy(false)
      }
    },
    [manager, refreshAfterTrade]
  )

  const setPositionTpSl = useCallback(
    async (params: SetPositionTpSlParams): Promise<boolean> => {
      if (!isManagerTradable(manager)) {
        showSnackbar('Connect a wallet to trade')
        return false
      }
      setBusy(true)
      try {
        const res = await manager.setPositionTpSl({
          coin: params.coin,
          sz: Math.abs(params.sizeContracts),
          positionIsLong: params.positionIsLong,
          takeProfitPx: params.takeProfitPx,
          stopLossPx: params.stopLossPx
        })
        return finalizeOrderResult(
          res,
          errCtx,
          'TP/SL updated',
          refreshAfterTrade
        )
      } catch (e) {
        reportOrderError(e, 'Failed to update TP/SL')
        return false
      } finally {
        setBusy(false)
      }
    },
    [manager, errCtx, refreshAfterTrade]
  )

  return {
    busy,
    closePosition,
    limitClose,
    cancelOrder,
    updateLeverage,
    updateIsolatedMargin,
    setPositionTpSl
  }
}
