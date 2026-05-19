import * as Sentry from '@sentry/react-native'
import { createMigrate, MigrationManifest, PersistedState } from 'redux-persist'
import { SentryTag } from 'services/sentry/types'
import { useSchemaMigrationFailure } from './schemaMigrationFailureStore'

type MigrationConfig = { debug: boolean }

type Migrate = (
  state: PersistedState,
  currentVersion: number
) => Promise<PersistedState>

/**
 * Drop-in replacement for `redux-persist`'s `createMigrate` that records
 * the first failing migration in `useSchemaMigrationFailure` and reports
 * it to Sentry before re-rejecting. Re-rejection preserves Redux Persist
 * semantics (the persistor stays unbootstrapped on failure); the provider
 * reads the failure record and re-throws during render so the top-level
 * `Sentry.ErrorBoundary` renders the global error fallback instead of
 * the rehydrated app.
 *
 * Each migration is wrapped so the failure record carries the *exact*
 * version that threw (not the target version), which is the more useful
 * datapoint for debugging.
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
        recordFailure(Number(version), err)
        throw err
      }
    }) as MigrationManifest[string]
  }
  return createMigrate(wrapped, config)
}

const recordFailure = (version: number, err: unknown): void => {
  const error = err instanceof Error ? err : new Error(String(err))

  // Avoid stomping on the first failure if a later layer also rejects —
  // the first one is the root cause we want to surface.
  if (useSchemaMigrationFailure.getState() !== null) return

  useSchemaMigrationFailure.setState({ error, version })

  Sentry.captureException(error, {
    tags: { system: SentryTag.SchemaMigration },
    extra: { version }
  })
}
