import { extractCancelError, extractOrderError } from '@avalabs/perps-sdk'
import { showSnackbar } from 'common/utils/toast'
import { useCallback, useMemo, useState } from 'react'
import { usePerps } from '../contexts/PerpsProvider'
import {
  DEFAULT_SLIPPAGE,
  finalizeCancelResult,
  finalizeOrderResult,
  isManagerTradable,
  logHyperliquidReject,
  orderErrorContext,
  reportOrderError,
  toastPerpsExchangeError
} from '../utils/orderExecution'
import { useClearLoadingOnPerpsReconnect } from './useClearLoadingOnPerpsReconnect'
import { usePerpsBuilderFee } from './usePerpsBuilderFee'

export type UpdatePositionTpSlParams = {
  coin: string
  /** Absolute position size (contracts) the TP/SL should reduce. */
  sizeContracts: number
  positionIsLong: boolean
  /**
   * Order ids of the position's existing TP/SL triggers to cancel before
   * placing replacements — the side(s) the user turned off or re-priced.
   * Hyperliquid has no "modify trigger": editing is cancel + re-place, and
   * re-placing without cancelling stacks a duplicate leg on the book.
   */
  cancelOids: readonly number[]
  /** New take-profit trigger price to place (omit to not place a TP leg). */
  takeProfitPx?: number
  /** New stop-loss trigger price to place (omit to not place a SL leg). */
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
    isCross: boolean,
    successMessage?: string
  ) => Promise<boolean>
  updateIsolatedMargin: (coin: string, usd: number) => Promise<boolean>
  updatePositionTpSl: (params: UpdatePositionTpSlParams) => Promise<boolean>
} => {
  const { manager, refreshAfterTrade, invalidateSessionAgent } = usePerps()
  // Core's revenue on each fill. Attached to reduce-only closes just like
  // opening orders; `undefined` while Markr info loads (never blocks a close).
  const { builderInfo } = usePerpsBuilderFee()
  const [busy, setBusy] = useState(false)
  const errCtx = useMemo(() => orderErrorContext(manager), [manager])
  // A dead agent key (pruned by HL) is cleared so the manager falls back to
  // master-wallet signing and the next enable-trading gate re-prompts.
  const onAgentInvalidated = useCallback(() => {
    void invalidateSessionAgent()
  }, [invalidateSessionAgent])
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
          refreshAfterTrade,
          onAgentInvalidated
        )
      } catch (e) {
        reportOrderError(e, 'Failed to close position', onAgentInvalidated)
        return false
      } finally {
        setBusy(false)
      }
    },
    [manager, errCtx, refreshAfterTrade, onAgentInvalidated, builderInfo]
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
          refreshAfterTrade,
          onAgentInvalidated
        )
      } catch (e) {
        reportOrderError(e, 'Failed to place limit close', onAgentInvalidated)
        return false
      } finally {
        setBusy(false)
      }
    },
    [manager, errCtx, refreshAfterTrade, onAgentInvalidated, builderInfo]
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
          refreshAfterTrade,
          onAgentInvalidated
        )
      } catch (e) {
        reportOrderError(e, 'Failed to cancel order', onAgentInvalidated)
        return false
      } finally {
        setBusy(false)
      }
    },
    [manager, errCtx, refreshAfterTrade, onAgentInvalidated]
  )

  const updateLeverage = useCallback(
    async (
      coin: string,
      leverage: number,
      isCross: boolean,
      successMessage = 'Leverage updated'
    ): Promise<boolean> => {
      if (!isManagerTradable(manager)) {
        showSnackbar('Connect a wallet to trade')
        return false
      }
      setBusy(true)
      try {
        await manager.updateLeverage({ coin, leverage, isCross })
        showSnackbar(successMessage)
        refreshAfterTrade()
        return true
      } catch (e) {
        reportOrderError(e, 'Failed to update leverage', onAgentInvalidated)
        return false
      } finally {
        setBusy(false)
      }
    },
    [manager, refreshAfterTrade, onAgentInvalidated]
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
        reportOrderError(e, 'Failed to update margin', onAgentInvalidated)
        return false
      } finally {
        setBusy(false)
      }
    },
    [manager, refreshAfterTrade, onAgentInvalidated]
  )

  const updatePositionTpSl = useCallback(
    async (params: UpdatePositionTpSlParams): Promise<boolean> => {
      if (!isManagerTradable(manager)) {
        showSnackbar('Connect a wallet to trade')
        return false
      }
      const hasPlacement =
        params.takeProfitPx !== undefined || params.stopLossPx !== undefined
      // Nothing to cancel and nothing to place — no-op (caller gates on this).
      if (params.cancelOids.length === 0 && !hasPlacement) {
        return false
      }
      const size = Math.abs(params.sizeContracts)
      if (hasPlacement && (!Number.isFinite(size) || size <= 0)) {
        return false
      }
      setBusy(true)
      try {
        // Cancel the stale triggers first so the placement below doesn't stack a
        // duplicate leg, and so a fully-cleared side is actually removed.
        for (const oid of params.cancelOids) {
          const res = await manager.cancelOpenOrder({ coin: params.coin, oid })
          const cancelErr = extractCancelError(res, errCtx)
          if (cancelErr !== undefined) {
            logHyperliquidReject('[perps] TP/SL trigger cancel rejected', {
              cancelErr,
              coin: params.coin,
              oid
            })
            toastPerpsExchangeError(cancelErr, onAgentInvalidated)
            return false
          }
        }
        if (hasPlacement) {
          const res = await manager.setPositionTpSl({
            coin: params.coin,
            sz: size,
            positionIsLong: params.positionIsLong,
            takeProfitPx: params.takeProfitPx,
            stopLossPx: params.stopLossPx
          })
          const orderErr = extractOrderError(res, errCtx)
          if (orderErr !== undefined) {
            logHyperliquidReject('[perps] TP/SL update rejected', {
              orderErr,
              coin: params.coin
            })
            toastPerpsExchangeError(orderErr, onAgentInvalidated)
            return false
          }
        }
        // Single toast + single post-trade refresh for the whole edit.
        showSnackbar(hasPlacement ? 'TP/SL updated' : 'TP/SL removed')
        refreshAfterTrade()
        return true
      } catch (e) {
        reportOrderError(e, 'Failed to update TP/SL', onAgentInvalidated)
        return false
      } finally {
        setBusy(false)
      }
    },
    [manager, errCtx, refreshAfterTrade, onAgentInvalidated]
  )

  return {
    busy,
    closePosition,
    limitClose,
    cancelOrder,
    updateLeverage,
    updateIsolatedMargin,
    updatePositionTpSl
  }
}
