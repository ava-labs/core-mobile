import { AppListenerEffectAPI } from 'store/types'
import { WalletId } from 'store/wallet/types'

/**
 * Composite key identifying a single migration execution slot in
 * `lastFailures`. Used so retries of the same failing migration replace
 * (rather than append) their failure record — keeping `lastFailures`
 * bounded.
 *
 * Format:
 * - per-wallet: `${walletId}:${version}` — e.g. `'abc-123:3'`
 * - global:     `global:${version}`      — e.g. `'global:7'`
 *
 * Wallet IDs are opaque identifiers (UUID-like), not the literal string
 * `'global'`, so the two namespaces don't collide.
 */
export type MigrationFailureKey = string

/**
 * Async, versioned, one-shot operations that run after the user unlocks the
 * app. Wallet secrets are available; per-wallet migrations have a `walletId`
 * in their context.
 *
 * For state-driven recurring checks (idempotent invariant repair), use
 * `store/listenerReconcilers/` instead.
 */
export interface ListenerMigration {
  /**
   * Ascending integer, never reused. Determines execution order.
   */
  version: number
  /** Stable identifier used in execution records and analytics. */
  name: string
  /** Human-readable description; surfaced in the migration debug screen. */
  description: string
  /**
   * - `'per-wallet'`: executor iterates wallets and invokes `migrate` once
   *    per wallet. Completion is tracked per `(walletId, version)`.
   * - `'global'`: executor invokes `migrate` once per app unlock. Completion
   *    is tracked per `version` only.
   */
  scope: ListenerMigrationScope
  migrate: (ctx: ListenerMigrationContext) => Promise<MigrationResult>
}

export type ListenerMigrationScope = 'per-wallet' | 'global'

export interface ListenerMigrationContext {
  listenerApi: AppListenerEffectAPI
  /** Present only when `scope === 'per-wallet'`. */
  walletId?: WalletId
}

/**
 * Outcome of a single migration execution.
 *
 * - `'applied'` — migration ran AND performed work.
 * - `'noOp'`    — migration ran but the state was already correct
 *                  (idempotency check returned early).
 * - `'failed'`  — migration ran and errored.
 */
export type MigrationOutcome = 'applied' | 'noOp' | 'failed'

/**
 * Returned by every `migrate(ctx)` call. The `outcome` field is the single
 * source of truth — `'applied'` and `'noOp'` both count as successful
 * completion (executor marks the migration as done either way); `'failed'`
 * keeps the migration pending and records a failure for retry.
 */
export interface MigrationResult {
  outcome: MigrationOutcome
  /** Present only when `outcome === 'failed'`. */
  error?: Error
}

/**
 * One per currently-failing migration. Replaced (not appended) on each retry,
 * cleared when the migration eventually succeeds. Stored under a
 * `MigrationFailureKey` in `ListenerMigrationStorageState.lastFailures`.
 */
export interface FailureRecord {
  version: number
  name: string
  scope: ListenerMigrationScope
  /** Present only when `scope === 'per-wallet'`. */
  walletId?: WalletId
  errorMessage: string
  /** Timestamp of the most recent attempt (ms since epoch). */
  failedAt: number
  /** Total number of failed attempts; bumps on every retry. */
  attemptCount: number
}

/**
 * Single MMKV-backed blob holding all listener-migration tracking state.
 * Stored as JSON under one key so writes are atomic.
 *
 * Bounded by design:
 * - `highestPerWallet`: O(wallets) — one number per wallet.
 * - `highestGlobal`: O(1).
 * - `lastFailures`: O(currently-failing migrations) — typically 0.
 *
 * Per-execution timeline lives in Sentry (breadcrumbs + failure
 * exceptions) — we deliberately don't keep one on-device.
 */
export interface ListenerMigrationStorageState {
  /**
   * Maps each wallet to the highest per-wallet migration version it has
   * successfully completed. One entry per wallet that has ever run any
   * per-wallet migration.
   *
   * Bounded by the number of wallets the user has — shipping new
   * migrations bumps existing entries' values rather than adding new keys.
   */
  highestPerWallet: Record<WalletId, number>
  /**
   * Highest successfully completed global migration version (a global
   * migration runs once per `onAppUnlocked`, not once per wallet).
   */
  highestGlobal: number
  /**
   * Currently-failing migrations keyed by `MigrationFailureKey`. Each
   * retry replaces (not appends to) its entry and bumps `attemptCount`.
   * Cleared when the migration eventually succeeds.
   *
   * Bounded by the number of migrations currently failing — typically zero.
   */
  lastFailures: Record<MigrationFailureKey, FailureRecord>
}
