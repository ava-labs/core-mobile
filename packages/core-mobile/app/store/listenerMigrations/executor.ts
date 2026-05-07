import * as Sentry from '@sentry/react-native'
import { AllowedSentryBreadcrumbCategory } from 'services/sentry/types'
import { selectActiveWallet, selectWallets } from 'store/wallet/slice'
import { AppListenerEffectAPI } from 'store/types'
import Logger from 'utils/Logger'
import { MigrationStateStorage } from './storage'
import {
  FailureRecord,
  ListenerMigration,
  ListenerMigrationContext,
  ListenerMigrationScope,
  MigrationResult
} from './types'
import { buildFailureKey, getLatestVersion } from './utils'

/**
 * Executes versioned listener migrations on `onAppUnlocked`. Tracks
 * completion per scope (per-wallet or global) in MMKV so each migration
 * runs at most once per scope.
 *
 * Storage is bounded: per-wallet completions collapse into a single number
 * per wallet (`highestPerWallet[walletId]`); current failures collapse into
 * a single record per failing migration (replaced on retry, cleared on
 * success). Per-execution timeline lives in Sentry (breadcrumbs + failure
 * exceptions) — we deliberately don't keep one on-device.
 *
 * One instance per app session is exported as the `listenerMigrationExecutor`
 * singleton from `./index.ts`. Tests construct their own with an in-memory
 * `MigrationStateStorage` and a custom migration array.
 */
export class ListenerMigrationExecutor {
  /**
   * Promise of the currently-running `executePendingMigrations` call, or
   * `null` when idle. Concurrent calls return this same promise so the
   * MMKV state isn't read/written by two passes in parallel (which would
   * race on `attemptCount` and watermark updates).
   */
  private inFlight: Promise<void> | null = null

  constructor(
    private readonly storage: MigrationStateStorage,
    private readonly migrations: ListenerMigration[]
  ) {}

  // ---------- public API ----------

  getHighestCompletedVersion(
    scope: ListenerMigrationScope,
    walletId?: string
  ): number {
    const state = this.storage.load()
    if (scope === 'global') return state.highestGlobal
    return walletId ? state.highestPerWallet[walletId] ?? 0 : 0
  }

  /** Currently-failing migrations. Cleared when a migration succeeds. */
  getCurrentFailures(): FailureRecord[] {
    return Object.values(this.storage.load().lastFailures)
  }

  /**
   * Marks every currently-registered per-wallet migration as already
   * complete for `walletId`. Call this when a wallet is freshly created
   * so it inherits the latest schema and skips historical migrations
   * entirely (mirrors how Redux Persist sets `_persist.version` to the
   * current version on a new install).
   */
  initializeNewWallet(walletId: string): void {
    const latest = getLatestVersion(this.migrations, 'per-wallet')
    if (latest === 0) return

    const state = this.storage.load()
    state.highestPerWallet[walletId] = Math.max(
      state.highestPerWallet[walletId] ?? 0,
      latest
    )
    this.storage.save(state)
  }

  /**
   * Run all pending migrations on `onAppUnlocked`. Iterates wallets for
   * per-wallet migrations (active wallet first), then runs global
   * migrations once.
   *
   * Failures are isolated per wallet/global scope. Within a scope, the
   * first failure stops subsequent migrations so the failed version stays
   * pending for retry on the next unlock — a successful v3 must not
   * advance the completed-version watermark past a still-failing v2.
   *
   * Two early-return guards:
   * - Empty registry: skip the redux selector and MMKV reads entirely.
   * - Already running: return the in-flight promise so a second
   *   `onAppUnlocked` doesn't race the first on MMKV state.
   */
  executePendingMigrations(listenerApi: AppListenerEffectAPI): Promise<void> {
    if (this.migrations.length === 0) return Promise.resolve()
    if (this.inFlight) return this.inFlight

    // Cleanup is chained via `.finally()` (not an inner `try/finally`) so
    // it runs strictly after the IIFE settles. An inner `finally` would
    // run synchronously on a sync throw — before `this.inFlight` is even
    // assigned — leaving the slot permanently stuck on the rejected
    // promise.
    const run = async (): Promise<void> => {
      const reduxState = listenerApi.getState()
      const activeWallet = selectActiveWallet(reduxState)
      const allWallets = Object.values(selectWallets(reduxState))

      // Active wallet first, then others in stable iteration order.
      const orderedWalletIds = [
        ...(activeWallet ? [activeWallet.id] : []),
        ...allWallets.filter(w => w.id !== activeWallet?.id).map(w => w.id)
      ]

      for (const walletId of orderedWalletIds) {
        await this.runScope('per-wallet', walletId, listenerApi)
      }
      await this.runScope('global', undefined, listenerApi)
    }

    this.inFlight = run().finally(() => {
      this.inFlight = null
    })
    return this.inFlight
  }

  // ---------- internals ----------

  private async runScope(
    scope: ListenerMigrationScope,
    walletId: string | undefined,
    listenerApi: AppListenerEffectAPI
  ): Promise<void> {
    if (scope === 'per-wallet' && !walletId) return

    const state = this.storage.load()
    const completed =
      scope === 'per-wallet'
        ? state.highestPerWallet[walletId as string] ?? 0
        : state.highestGlobal

    const pending = this.migrations
      .filter(m => m.scope === scope && m.version > completed)
      .sort((a, b) => a.version - b.version)

    for (const migration of pending) {
      const result = await this.runMigration(migration, {
        listenerApi,
        walletId
      })
      // Stop on first failure within scope so the failed version stays
      // pending — otherwise a later success would bump the watermark past it.
      if (result.outcome === 'failed') break
    }
  }

  private async runMigration(
    migration: ListenerMigration,
    ctx: ListenerMigrationContext
  ): Promise<MigrationResult> {
    const startedAt = Date.now()

    let result: MigrationResult
    try {
      result = await migration.migrate(ctx)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      Logger.error(
        `[ListenerMigrationExecutor] migration "${migration.name}" threw`,
        error
      )
      result = { outcome: 'failed', error }
    }

    this.recordOutcome({
      migration,
      walletId: ctx.walletId,
      result,
      startedAt
    })
    return result
  }

  /**
   * Persists the outcome to MMKV, emits a Sentry breadcrumb, and logs a
   * warning on failure. Breadcrumbs use category `listenerMigration` which
   * is allowlisted in `SentryService.beforeBreadcrumb`.
   */
  private recordOutcome(opts: {
    migration: ListenerMigration
    walletId: string | undefined
    result: MigrationResult
    startedAt: number
  }): void {
    const { migration, walletId, result, startedAt } = opts
    const state = this.storage.load()
    const key = buildFailureKey(migration.scope, migration.version, walletId)

    if (result.outcome === 'failed') {
      const previous = state.lastFailures[key]
      state.lastFailures[key] = {
        version: migration.version,
        name: migration.name,
        scope: migration.scope,
        walletId,
        errorMessage: result.error?.message ?? 'unknown error',
        failedAt: startedAt,
        attemptCount: (previous?.attemptCount ?? 0) + 1
      }
    } else {
      // 'applied' or 'noOp': bump watermark, clear any prior failure.
      if (migration.scope === 'per-wallet' && walletId) {
        state.highestPerWallet[walletId] = Math.max(
          state.highestPerWallet[walletId] ?? 0,
          migration.version
        )
      } else if (migration.scope === 'global') {
        state.highestGlobal = Math.max(state.highestGlobal, migration.version)
      }
      delete state.lastFailures[key]
    }
    this.storage.save(state)

    Sentry.addBreadcrumb({
      category: AllowedSentryBreadcrumbCategory.ListenerMigration,
      message: `${migration.name} (v${migration.version}) — ${result.outcome}`,
      level: result.outcome === 'failed' ? 'error' : 'info',
      data: {
        scope: migration.scope,
        walletId,
        durationMs: Date.now() - startedAt,
        errorMessage: result.error?.message
      }
    })

    if (result.outcome === 'failed') {
      Logger.warn(
        `[ListenerMigrationExecutor] migration "${migration.name}" failed; halting subsequent migrations within this scope until next unlock`,
        result.error?.message
      )
    }
  }
}
