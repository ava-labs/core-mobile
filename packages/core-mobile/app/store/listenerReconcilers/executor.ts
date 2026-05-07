import * as Sentry from '@sentry/react-native'
import { AllowedSentryBreadcrumbCategory } from 'services/sentry/types'
import { AppListenerEffectAPI } from 'store/types'
import Logger from 'utils/Logger'
import { Reconciler, ReconcilerResult } from './types'

/**
 * Runs all registered listener reconcilers sequentially on every
 * `onAppUnlocked`. Each reconciler is responsible for its own
 * idempotency check (read state → return `noOp` if no work needed).
 *
 * Errors are isolated per reconciler — a failure does not stop the next
 * reconciler from running. Failures emit a Sentry breadcrumb at
 * `error` level and an error log; no rate-limiting (low reconciler
 * count + per-execution failure volume makes it unnecessary).
 *
 * No state is persisted: reconcilers don't track completion. Per-execution
 * timeline lives in Sentry breadcrumbs today; an analytics event is
 * planned but not wired up in this PR.
 *
 * One instance per app session is exported as the
 * `listenerReconcilerExecutor` singleton from `./index.ts`. Tests
 * construct their own with a custom reconciler array.
 */
export class ListenerReconcilerExecutor {
  /**
   * Promise of the currently-running `executeAll` call, or `null` when
   * idle. Concurrent calls return this same promise so a rapid
   * unlock-after-unlock doesn't double-emit breadcrumbs/analytics or
   * run the same reconciler twice in parallel.
   */
  private inFlight: Promise<void> | null = null

  constructor(private readonly reconcilers: Reconciler[]) {}

  /**
   * Runs every registered reconciler in registration order. Errors
   * thrown by a reconciler are caught and recorded as `'failed'`;
   * subsequent reconcilers still run.
   *
   * Two early-return guards:
   * - Empty registry: skip the loop entirely (no breadcrumb noise).
   * - Already running: return the in-flight promise so a second
   *   `onAppUnlocked` doesn't run the chain in parallel.
   */
  executeAll(listenerApi: AppListenerEffectAPI): Promise<void> {
    if (this.reconcilers.length === 0) return Promise.resolve()
    if (this.inFlight) return this.inFlight

    // Cleanup chained via `.finally()` (not an inner `try/finally`) so it
    // runs strictly after the IIFE settles. An inner `finally` would run
    // synchronously on a sync throw — before `this.inFlight` is even
    // assigned — leaving the slot permanently stuck on the rejected
    // promise.
    const run = async (): Promise<void> => {
      for (const reconciler of this.reconcilers) {
        await this.runReconciler(reconciler, { listenerApi })
      }
    }

    this.inFlight = run().finally(() => {
      this.inFlight = null
    })
    return this.inFlight
  }

  private async runReconciler(
    reconciler: Reconciler,
    ctx: { listenerApi: AppListenerEffectAPI }
  ): Promise<ReconcilerResult> {
    const startedAt = Date.now()

    let result: ReconcilerResult
    try {
      result = await reconciler.reconcile(ctx)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      result = { outcome: 'failed', error }
    }

    this.recordOutcome({ reconciler, result, startedAt })
    return result
  }

  /**
   * Emits a Sentry breadcrumb (allowlisted category `listenerReconciler`)
   * and, on failure, logs the error (single sink for both thrown and
   * explicitly-returned `outcome: 'failed'`). No on-device persistence —
   * reconcilers don't track completion.
   */
  private recordOutcome(opts: {
    reconciler: Reconciler
    result: ReconcilerResult
    startedAt: number
  }): void {
    const { reconciler, result, startedAt } = opts

    Sentry.addBreadcrumb({
      category: AllowedSentryBreadcrumbCategory.ListenerReconciler,
      message: `${reconciler.name} — ${result.outcome}`,
      level: result.outcome === 'failed' ? 'error' : 'info',
      data: {
        durationMs: Date.now() - startedAt,
        errorMessage: result.error?.message,
        metadata: result.metadata
      }
    })

    if (result.outcome === 'failed') {
      Logger.error(
        `[ListenerReconcilerExecutor] reconciler "${reconciler.name}" failed`,
        result.error
      )
    }
  }
}
