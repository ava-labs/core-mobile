import { AnyAction } from '@reduxjs/toolkit'
import type { RpcRequest } from '@avalabs/vm-module-types'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { onInAppRequestSucceeded, onRequest } from 'store/rpc/slice'
import { AppListenerEffectAPI, AppStartListening } from 'store/types'
import { readRecurringSwapApprovalContext } from 'vmModule/ApprovalController/validators/shared'
import { queryClient } from 'contexts/ReactQueryProvider'
import { showSnackbar } from 'new/common/utils/toast'
import Logger from 'utils/Logger'
import type { QueryCacheNotifyEvent } from '@tanstack/react-query'
import { RECURRING_SCHEDULES_QK } from '../hooks/useRecurringSchedules'
import { getRecurringSchedulesService } from '../services/RecurringSchedulesService.singleton'
import type { Schedule } from '../types'
import {
  loadSeenFailures,
  saveSeenFailures,
  loadAutoCancelled,
  saveAutoCancelled,
  makeFailureKey
} from '../utils/seenFailures'

// ─── Failure reasons that trigger auto-cancel ─────────────────────────────────

const AUTO_CANCEL_REASONS = new Set([
  'Slippage tolerance exceeded',
  'Insufficient balance'
])

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

// ─── Failure watcher ──────────────────────────────────────────────────────────

/**
 * Process a single schedule snapshot, detecting new failures and completed
 * transitions. Mutates `seenFailures` and `autoCancelled` in-place and
 * returns `{ failuresDirty, cancelledDirty }` to tell the caller which sets
 * need to be persisted.
 */
async function processSchedule(
  schedule: Schedule,
  seenFailures: Set<string>,
  autoCancelled: Set<string>
): Promise<{ failuresDirty: boolean; cancelledDirty: boolean }> {
  let failuresDirty = false
  let cancelledDirty = false

  // ── Completed analytics (once per order) ──────────────────────────────────
  const completedKey = `${schedule.orderId}:completed`
  if (schedule.status === 'completed' && !seenFailures.has(completedKey)) {
    seenFailures.add(completedKey)
    failuresDirty = true
    AnalyticsService.capture('RecurringSwapCompleted', {
      orderId: schedule.orderId,
      chainId: schedule.chainId,
      executedOrders: schedule.executedOrders
    })
  }

  // ── Per-failure diff ──────────────────────────────────────────────────────
  for (const failure of schedule.failures) {
    const key = makeFailureKey(schedule.orderId, failure.executionIndex)
    if (seenFailures.has(key)) continue

    // Mark seen immediately so concurrent events don't double-fire
    seenFailures.add(key)
    failuresDirty = true

    AnalyticsService.capture('RecurringSwapFailed', {
      orderId: schedule.orderId,
      chainId: schedule.chainId,
      executionIndex: failure.executionIndex,
      reasons: failure.reasons,
      tryCount: failure.tryCount,
      failedAt: failure.failedAt
    })

    showSnackbar('Recurring swap execution failed')

    // ── Auto-cancel check ─────────────────────────────────────────────────
    const triggerReason = failure.reasons.find(r => AUTO_CANCEL_REASONS.has(r))
    const isActive = schedule.status === 'active'
    const alreadyCancelled = autoCancelled.has(schedule.orderId)

    if (triggerReason && isActive && !alreadyCancelled) {
      // Optimistically mark as cancelled before the network call
      autoCancelled.add(schedule.orderId)
      cancelledDirty = true

      try {
        await getRecurringSchedulesService().cancel({
          orderId: schedule.orderId,
          address: schedule.owner
        })

        AnalyticsService.capture('RecurringSwapAutoCancelled', {
          orderId: schedule.orderId,
          chainId: schedule.chainId,
          triggerReason,
          executedOrders: schedule.executedOrders,
          failedExecutionIndex: failure.executionIndex
        })

        showSnackbar('Recurring swap cancelled due to repeated failures')

        queryClient.invalidateQueries({ queryKey: RECURRING_SCHEDULES_QK })
      } catch (err) {
        // Roll back so the next refetch can retry
        autoCancelled.delete(schedule.orderId)
        cancelledDirty = true
        Logger.warn(
          '[RecurringSwap] Auto-cancel failed, will retry on next refresh',
          err
        )
      }
    }
  }

  return { failuresDirty, cancelledDirty }
}

/**
 * Subscribe to the React Query cache and watch all RECURRING_SCHEDULES queries
 * for new failures, auto-cancel triggers, and completion events.
 *
 * Call once at app startup (from `store/middleware/listener.ts`).
 */
export function startRecurringFailureWatcher(): void {
  queryClient.getQueryCache().subscribe((event: QueryCacheNotifyEvent) => {
    if (
      event.query.queryKey?.[0] !== RECURRING_SCHEDULES_QK[0] ||
      event.type !== 'updated' ||
      event.query.state.status !== 'success'
    ) {
      return
    }

    const schedules = event.query.state.data as Schedule[] | undefined
    if (!schedules || schedules.length === 0) return

    const seenFailures = loadSeenFailures()
    const autoCancelled = loadAutoCancelled()
    let failuresDirty = false
    let cancelledDirty = false

    // Process all schedules sequentially — fire-and-forget, errors logged inside
    const run = async (): Promise<void> => {
      for (const schedule of schedules) {
        const result = await processSchedule(schedule, seenFailures, autoCancelled)
        if (result.failuresDirty) failuresDirty = true
        if (result.cancelledDirty) cancelledDirty = true
      }
      if (failuresDirty) saveSeenFailures(seenFailures)
      if (cancelledDirty) saveAutoCancelled(autoCancelled)
    }

    run().catch(err =>
      Logger.error('[RecurringSwap] Failure watcher error', err)
    )
  })
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
