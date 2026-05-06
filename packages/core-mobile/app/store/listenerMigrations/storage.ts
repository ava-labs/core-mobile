import { MMKV } from 'react-native-mmkv'
import { MigrationStorageKeys } from 'utils/mmkv'
import Logger from 'utils/Logger'
import { ListenerMigrationStorageState } from './types'
import { emptyStorageState, sanitizeStorageState } from './utils'

/**
 * Persistence boundary for the listener migration system. The executor
 * depends on this interface, not on MMKV directly — keeping its storage
 * concerns out of the migration logic and letting tests swap in an
 * in-memory implementation.
 *
 * Implementations MUST satisfy the following contract:
 *
 * - `load()` returns a freshly-owned object that the caller may mutate
 *   freely. Mutations to the returned value MUST NOT affect the stored
 *   state until they're handed back via `save()`. (Both the MMKV and
 *   in-memory implementations satisfy this by deserializing on read.)
 *
 * - `save(state)` snapshots `state` at call time. Mutations to `state`
 *   after `save()` returns MUST NOT affect what was persisted.
 *
 * The executor relies on this contract to mutate state in place between
 * `load()` and `save()`. Any implementation that returns a cached
 * reference would break that pattern.
 */
export interface MigrationStateStorage {
  load(): ListenerMigrationStorageState
  save(state: ListenerMigrationStorageState): void
}

/**
 * MMKV-backed implementation. Stores the entire migration state as a
 * single JSON blob under one key so writes are atomic.
 *
 * On parse failure (corrupt blob, schema drift) the state resets to empty
 * — the executor will simply re-run pending migrations next unlock, which
 * is safe because each migration is responsible for its own idempotency.
 */
export class MmkvMigrationStateStorage implements MigrationStateStorage {
  constructor(
    private readonly mmkv: MMKV,
    private readonly storageKey: string = MigrationStorageKeys.LISTENER_MIGRATIONS_STATE
  ) {}

  load(): ListenerMigrationStorageState {
    const raw = this.mmkv.getString(this.storageKey)
    if (!raw) return emptyStorageState()
    try {
      // Sanitize each field independently — defends against corrupt blobs
      // and unexpected schema drift (e.g. a wrong type sneaking into a
      // field). Invalid fields fall back to their empty defaults rather
      // than being passed through, so subsequent writes can't crash.
      return sanitizeStorageState(JSON.parse(raw))
    } catch (err) {
      Logger.error(
        '[MmkvMigrationStateStorage] failed to parse state, resetting',
        err
      )
      return emptyStorageState()
    }
  }

  save(state: ListenerMigrationStorageState): void {
    this.mmkv.set(this.storageKey, JSON.stringify(state))
  }
}
