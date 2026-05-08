import { migrationStorage } from 'utils/mmkv'
import { ListenerMigrationExecutor } from './executor'
import { MmkvMigrationStateStorage } from './storage'
import { ListenerMigration } from './types'
import { getLatestVersion, validateRegistry } from './utils'

/**
 * Registry of all listener migrations. Add new migrations here in ascending
 * version order. Versions must be unique and never reused.
 *
 * Migrations run on `onAppUnlocked` via the executor. New migrations are
 * picked up automatically — no other registration step is required.
 */
export const listenerMigrations: ListenerMigration[] = []

/**
 * Highest version present in the registry across all scopes. Surfaced in
 * the migration debug screen to display "wallet at v3 of v5".
 */
export const LISTENER_MIGRATION_VERSION = getLatestVersion(listenerMigrations)

validateRegistry(listenerMigrations)

/**
 * App-wide singleton. Use this from `onAppUnlocked` integration (CP-13982)
 * and from wallet creation flows that call `initializeNewWallet` (CP-13988).
 */
export const listenerMigrationExecutor = new ListenerMigrationExecutor(
  new MmkvMigrationStateStorage(migrationStorage),
  listenerMigrations
)
