import {
  ListenerMigration,
  ListenerMigrationScope,
  ListenerMigrationStorageState,
  MigrationFailureKey
} from './types'

/**
 * Builds a fresh empty `ListenerMigrationStorageState` — used when MMKV has
 * no record yet (fresh install) or when the persisted JSON fails to parse.
 *
 * Returns a new object every call so callers can mutate freely without
 * affecting any shared baseline. (A frozen `const EMPTY_STORAGE_STATE`
 * would have its nested `highestPerWallet`/`lastFailures` objects shared
 * across all `{...EMPTY_STORAGE_STATE}` spreads, which is a footgun.)
 */
export const emptyStorageState = (): ListenerMigrationStorageState => ({
  highestPerWallet: {},
  highestGlobal: 0,
  lastFailures: {}
})

/**
 * Builds the composite key used to slot a `FailureRecord` in
 * `lastFailures`. See `MigrationFailureKey` for the format spec.
 */
export const buildFailureKey = (
  scope: ListenerMigrationScope,
  version: number,
  walletId: string | undefined
): MigrationFailureKey =>
  scope === 'global' ? `global:${version}` : `${walletId}:${version}`

/**
 * Highest `version` among the given migrations. Pass a `scope` to filter
 * to a single timeline (per-wallet OR global); omit it to consider every
 * migration in the registry.
 *
 * Returns 0 when no migrations match — e.g. an empty registry, or asking
 * for `'global'` when only per-wallet migrations are registered.
 */
export const getLatestVersion = (
  migrations: ListenerMigration[],
  scope?: ListenerMigrationScope
): number => {
  const eligible = scope
    ? migrations.filter(m => m.scope === scope)
    : migrations
  return eligible.reduce((max, m) => Math.max(max, m.version), 0)
}

/**
 * Throws if a single migration is missing a required field or has an
 * invalid value. Called for each entry in the registry by
 * `validateRegistry`.
 */
const assertValidShape = (m: ListenerMigration): void => {
  if (typeof m.version !== 'number' || m.version <= 0) {
    throw new Error(
      `[listenerMigrations] migration "${m.name}" has invalid version: ${m.version}`
    )
  }
  if (!m.name) {
    throw new Error(
      `[listenerMigrations] migration with version ${m.version} is missing a name`
    )
  }
  if (!m.description) {
    throw new Error(
      `[listenerMigrations] migration "${m.name}" is missing a description`
    )
  }
  if (m.scope !== 'per-wallet' && m.scope !== 'global') {
    throw new Error(
      `[listenerMigrations] migration "${m.name}" has invalid scope: ${m.scope}`
    )
  }
  if (typeof m.migrate !== 'function') {
    throw new Error(
      `[listenerMigrations] migration "${m.name}" is missing a migrate function`
    )
  }
}

/**
 * Validates the registry at module load. Throws if any migration is
 * malformed, if two migrations share a `(scope, version)` pair, or if two
 * migrations share a name. Crashing at import is intentional — a
 * malformed registry is a programming error that must be caught before
 * the app boots.
 *
 * Versions are unique *per scope*: `per-wallet:1` and `global:1` are
 * allowed because their completion is tracked in independent fields
 * (`highestPerWallet` vs `highestGlobal`). Two `per-wallet:1` migrations
 * would silently skip each other and is rejected.
 */
export const validateRegistry = (migrations: ListenerMigration[]): void => {
  const seenScopeVersions = new Set<string>()
  const seenNames = new Set<string>()

  for (const migration of migrations) {
    assertValidShape(migration)

    const scopeVersionKey = `${migration.scope}:${migration.version}`
    if (seenScopeVersions.has(scopeVersionKey)) {
      throw new Error(
        `[listenerMigrations] duplicate migration version within scope: ${scopeVersionKey}`
      )
    }
    if (seenNames.has(migration.name)) {
      throw new Error(
        `[listenerMigrations] duplicate migration name: ${migration.name}`
      )
    }
    seenScopeVersions.add(scopeVersionKey)
    seenNames.add(migration.name)
  }
}
