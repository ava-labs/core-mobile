import { createMigrate, MigrationManifest, PersistedState } from 'redux-persist'
import {
  SchemaMigrationError,
  useSchemaMigrationFailure
} from './schemaMigrationFailureStore'

type MigrationConfig = { debug: boolean }

type Migrate = (
  state: PersistedState,
  currentVersion: number
) => Promise<PersistedState>

/**
 * Drop-in replacement for `redux-persist`'s `createMigrate`. On a migrate
 * rejection it wraps the original error in a `SchemaMigrationError`,
 * records it in `useSchemaMigrationFailure`, and re-throws so redux-persist's
 * existing error semantics aren't disturbed.
 *
 * Sentry reporting is owned by the top-level `Sentry.ErrorBoundary` in
 * `ContextApp.tsx` (via `beforeCapture`) — a single capture path keyed
 * on `instanceof SchemaMigrationError` attaches `system` tag + `version`
 * context, avoiding duplicate events.
 *
 * Each migration is wrapped so the recorded version is the *exact* one
 * that threw (not the target version), which is the more useful datapoint
 * for debugging.
 */
export const createInstrumentedMigrate = (
  manifest: MigrationManifest,
  config?: MigrationConfig
): Migrate => {
  const wrapped: MigrationManifest = {}
  for (const [version, migrate] of Object.entries(manifest)) {
    // The MigrationManifest entry type is a union of sync/async signatures,
    // so wrapping requires a single async-returning function — cast through
    // the broader Promise-returning shape.
    wrapped[version] = (async state => {
      try {
        return await migrate(state)
      } catch (err) {
        const cause = err instanceof Error ? err : new Error(String(err))
        const error = new SchemaMigrationError(Number(version), cause)
        recordFailure(error)
        throw error
      }
    }) as MigrationManifest[string]
  }
  return createMigrate(wrapped, config)
}

const recordFailure = (error: SchemaMigrationError): void => {
  // Avoid stomping on the first failure if a later layer also rejects —
  // the first one is the root cause we want to surface.
  if (useSchemaMigrationFailure.getState() !== null) return
  useSchemaMigrationFailure.setState(error)
}
