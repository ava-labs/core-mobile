import { AnyAction } from '@reduxjs/toolkit'
import type { RpcRequest } from '@avalabs/vm-module-types'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { onInAppRequestSucceeded, onRequest } from 'store/rpc/slice'
import { AppListenerEffectAPI, AppStartListening } from 'store/types'
import { readRecurringSwapApprovalContext } from 'vmModule/ApprovalController/validators/shared'
import { queryClient } from 'contexts/ReactQueryProvider'
import { RECURRING_SCHEDULES_QK } from '../hooks/useRecurringSchedules'

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Safely reads the recurring-swap approval context from an onRequest action.
 * Returns undefined if the action is not an onRequest, the payload is not an
 * RpcRequest, or the context is missing / malformed.
 */
const getRecurringSwapCtx = (
  action: AnyAction
) => {
  if (!onRequest.match(action)) return undefined
  // request.context is typed as Record<string, unknown> | undefined on the
  // local RpcRequest, which is structurally compatible with the vm-module
  // RpcRequest. Cast through unknown to satisfy the type checker.
  return readRecurringSwapApprovalContext(
    action.payload as unknown as RpcRequest
  )
}

// ─── Predicate ───────────────────────────────────────────────────────────────

/**
 * RTK `AnyListenerPredicate` — returns true for in-app `eth_sendTransaction`
 * requests that carry a recurring-swap context with `step === 'fill'` (i.e.
 * the first-fill tx, not the ERC-20 allowance approval).
 *
 * Uses `predicate` (not `matcher`) so RTK accepts a plain boolean-returning
 * function rather than requiring a typed MatchFunction.
 */
const isRecurringSwapFillRequest = (action: AnyAction): boolean =>
  getRecurringSwapCtx(action)?.step === 'fill'

// ─── Effect ──────────────────────────────────────────────────────────────────

const handleRecurringSwapFillConfirmed = async (
  action: AnyAction,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const ctx = getRecurringSwapCtx(action)
  // Double-guard: matcher already filtered, but be defensive.
  if (!ctx || ctx.step !== 'fill') return

  const requestId = (action.payload as { data: { id: number } }).data.id

  // Wait for the VM module to confirm the fill tx.
  const [confirmedAction] = await listenerApi.take(
    (a: AnyAction) =>
      onInAppRequestSucceeded.match(a) && a.payload.requestId === requestId
  )

  if (!onInAppRequestSucceeded.match(confirmedAction)) return

  AnalyticsService.capture('RecurringSwapScheduled', {
    scheduleUuid: ctx.quoteUuid,
    chainId: ctx.chainId,
    fromTokenSymbol: ctx.fromTokenSymbol,
    toTokenSymbol: ctx.toTokenSymbol,
    amountPerOrder: ctx.amountPerOrder,
    numberOfOrders: ctx.numberOfOrders,
    isUnlimited: ctx.isUnlimited,
    intervalSeconds: ctx.intervalSeconds
  })

  queryClient.invalidateQueries({ queryKey: RECURRING_SCHEDULES_QK })
}

// ─── Registration ─────────────────────────────────────────────────────────────

export const addRecurringSwapListeners = (
  startListening: AppStartListening
): void => {
  startListening({
    predicate: isRecurringSwapFillRequest,
    effect: handleRecurringSwapFillConfirmed
  })
}
