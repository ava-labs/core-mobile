import { createZustandStore } from 'common/utils/createZustandStore'

/**
 * Typed error thrown by `createInstrumentedMigrate` when a Redux Persist
 * schema migration rejects. Carries the failing version so the top-level
 * `Sentry.ErrorBoundary` (see `ContextApp.tsx`) can attach it as Sentry
 * context when the boundary captures the throw — single capture path,
 * no duplicate events.
 */
export class SchemaMigrationError extends Error {
  readonly version: number

  constructor(version: number, cause: Error) {
    super(cause.message, { cause })
    this.name = 'SchemaMigrationError'
    this.stack = cause.stack
    this.version = version
  }
}

/**
 * Bridges an async migrate rejection to a render-time throw. Set by
 * `createInstrumentedMigrate` when a migration rejects; read by
 * `EncryptedStoreProvider`, which re-throws during render so the
 * top-level `Sentry.ErrorBoundary` catches it and renders the global
 * error fallback.
 *
 * Not persisted: lives in module-level state and is discarded when the
 * JS bundle reloads (e.g. when the user taps "Reload" on the global
 * error fallback, which calls `RNRestart.Restart()`).
 */
export const useSchemaMigrationFailure =
  createZustandStore<SchemaMigrationError | null>(null)
