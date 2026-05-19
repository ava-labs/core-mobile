import { createZustandStore } from 'common/utils/createZustandStore'

/**
 * Captures the most recent schema migration failure (if any). Set by
 * `createInstrumentedMigrate` when a Redux Persist migration rejects;
 * read by `EncryptedStoreProvider`, which re-throws during render so the
 * top-level `Sentry.ErrorBoundary` renders the global error fallback
 * instead of the rehydrated app.
 *
 * Not persisted: the failure record lives in module-level state, so it
 * is discarded automatically when the JS bundle reloads (e.g. when the
 * user taps "Reload" on the global error fallback, which calls
 * `RNRestart.Restart()`).
 */
export type SchemaMigrationFailure = {
  /** Schema version the migrate step was trying to reach when it failed. */
  version: number
  /** Original error thrown / rejected by the migrate function. */
  error: Error
}

export const useSchemaMigrationFailure =
  createZustandStore<SchemaMigrationFailure | null>(null)
