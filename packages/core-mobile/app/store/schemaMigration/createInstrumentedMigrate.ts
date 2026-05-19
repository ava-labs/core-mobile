import { createMigrate, MigrationManifest, PersistedState } from 'redux-persist'
import SentryService from 'services/sentry/SentryService'
import { SentryTag } from 'services/sentry/types'
import { useSchemaMigrationFailure } from './schemaMigrationFailureStore'

type MigrationConfig = { debug: boolean }

type Migrate = (
  state: PersistedState,
  currentVersion: number
) => Promise<PersistedState>

/**
 * Drop-in replacement for `redux-persist`'s `createMigrate` that records
 * the first failing migration in `useSchemaMigrationFailure`, reports it
 * to Sentry, and re-throws.
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
        // Normalize first so downstream consumers (redux-persist `migrateErr`,
        // dev console, the failure store) always see a proper message + stack.
        const error = err instanceof Error ? err : new Error(String(err))
        recordFailure(Number(version), error)
        throw error
      }
    }) as MigrationManifest[string]
  }
  return createMigrate(wrapped, config)
}

const recordFailure = (version: number, error: Error): void => {
  // Avoid stomping on the first failure if a later layer also rejects —
  // the first one is the root cause we want to surface.
  if (useSchemaMigrationFailure.getState() !== null) return

  useSchemaMigrationFailure.setState({ error, version })

  SentryService.captureException('Schema migration failure', error, {
    system: SentryTag.SchemaMigration,
    version: String(version)
  })
}
