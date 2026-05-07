import { AppListenerEffectAPI } from 'store/types'

/**
 * Listener reconcilers are async, idempotent state-driven operations that
 * run on every `onAppUnlocked`. They check current state and only do work
 * if the state is incomplete (e.g. a chain is missing addresses for some
 * accounts). They do NOT track completion and have no version — each
 * reconciler is responsible for its own short-circuit / no-op check.
 *
 * For one-shot, versioned operations that should run at most once per
 * scope (per-wallet or global), use `store/listenerMigrations/` instead.
 *
 * Naming note: this is the Kubernetes-flavor reconciler ("a control loop
 * that watches state and moves it toward desired state"), not the
 * redux-persist `stateReconciler` (which merges persisted state with
 * `initialState` on rehydrate). They share a name but are unrelated.
 */
export interface Reconciler {
  /** Stable identifier used in analytics events and Sentry breadcrumbs. */
  name: string
  /** Human-readable description; surfaced in the reconciler debug screen. */
  description: string
  reconcile: (ctx: ReconcilerContext) => Promise<ReconcilerResult>
}

export interface ReconcilerContext {
  listenerApi: AppListenerEffectAPI
}

/**
 * Outcome of a single reconciler execution. Aligned with
 * `MigrationOutcome` so analytics dashboards can group by `outcome`
 * across both systems.
 *
 * - `'applied'` — reconciler ran AND performed work.
 * - `'noOp'`    — reconciler ran but state was already correct.
 * - `'failed'`  — reconciler ran and errored.
 */
export type ReconcilerOutcome = 'applied' | 'noOp' | 'failed'

/**
 * Returned by every `reconcile(ctx)` call. The `outcome` field drives
 * analytics and Sentry breadcrumb level. `metadata` is free-form
 * per-reconciler context (e.g. `{ accountsAdded: 3 }`) — consumed by
 * the analytics event so the team can see "what work did this
 * reconciler do" trended over time, and used to drive the removal
 * policy (when `applied %` stays near 0 for 30+ days, remove the
 * reconciler).
 */
export interface ReconcilerResult {
  outcome: ReconcilerOutcome
  /** Present only when `outcome === 'failed'`. */
  error?: Error
  /** Free-form per-reconciler context for analytics. */
  metadata?: Record<string, unknown>
}
