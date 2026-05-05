import { ListenerMigration, MigrationResult } from './types'
import {
  buildFailureKey,
  emptyStorageState,
  getLatestVersion,
  validateRegistry
} from './utils'

const makeMigration = (
  overrides: Partial<ListenerMigration> &
    Pick<ListenerMigration, 'version' | 'scope'>
): ListenerMigration => ({
  name: overrides.name ?? `migration-${overrides.version}`,
  description: overrides.description ?? `description ${overrides.version}`,
  migrate:
    overrides.migrate ??
    (async () => ({ outcome: 'applied' } as MigrationResult)),
  ...overrides
})

describe('buildFailureKey', () => {
  it('formats per-wallet keys as `${walletId}:${version}`', () => {
    expect(buildFailureKey('per-wallet', 3, 'abc-123')).toBe('abc-123:3')
  })

  it('formats global keys as `global:${version}` and ignores walletId', () => {
    expect(buildFailureKey('global', 7, undefined)).toBe('global:7')
    // Even if a walletId is somehow passed, the key stays scope-correct.
    expect(buildFailureKey('global', 7, 'abc-123')).toBe('global:7')
  })

  it('produces distinct keys for the same version under different scopes', () => {
    expect(buildFailureKey('per-wallet', 1, 'wallet-a')).not.toBe(
      buildFailureKey('global', 1, undefined)
    )
  })
})

describe('getLatestVersion', () => {
  it('returns 0 for an empty registry', () => {
    expect(getLatestVersion([])).toBe(0)
  })

  it('returns the highest version across all scopes when no scope filter is given', () => {
    const migrations = [
      makeMigration({ version: 2, scope: 'per-wallet', name: 'a' }),
      makeMigration({ version: 5, scope: 'global', name: 'b' }),
      makeMigration({ version: 3, scope: 'per-wallet', name: 'c' })
    ]
    expect(getLatestVersion(migrations)).toBe(5)
  })

  it('returns the highest version within a given scope', () => {
    const migrations = [
      makeMigration({ version: 2, scope: 'per-wallet', name: 'a' }),
      makeMigration({ version: 5, scope: 'global', name: 'b' }),
      makeMigration({ version: 3, scope: 'per-wallet', name: 'c' })
    ]
    expect(getLatestVersion(migrations, 'per-wallet')).toBe(3)
    expect(getLatestVersion(migrations, 'global')).toBe(5)
  })

  it('returns 0 when no migrations match the requested scope', () => {
    const migrations = [
      makeMigration({ version: 2, scope: 'per-wallet', name: 'a' })
    ]
    expect(getLatestVersion(migrations, 'global')).toBe(0)
  })
})

describe('emptyStorageState', () => {
  it('returns the expected default shape', () => {
    expect(emptyStorageState()).toEqual({
      highestPerWallet: {},
      highestGlobal: 0,
      lastFailures: {}
    })
  })

  it('returns a fresh object each call (mutations do not leak)', () => {
    const a = emptyStorageState()
    a.highestPerWallet['wallet-1'] = 5
    a.lastFailures.k = {
      version: 1,
      name: 'm',
      scope: 'per-wallet',
      errorMessage: 'oops',
      failedAt: 0,
      attemptCount: 1
    }
    a.highestGlobal = 9

    const b = emptyStorageState()
    expect(b.highestPerWallet).toEqual({})
    expect(b.lastFailures).toEqual({})
    expect(b.highestGlobal).toBe(0)
  })
})

describe('validateRegistry', () => {
  it('throws on duplicate version within the same scope', () => {
    expect(() =>
      validateRegistry([
        makeMigration({ version: 1, scope: 'per-wallet', name: 'a' }),
        makeMigration({ version: 1, scope: 'per-wallet', name: 'b' })
      ])
    ).toThrow(/duplicate migration version within scope: per-wallet:1/)
  })

  it('allows the same version across different scopes', () => {
    // per-wallet:1 and global:1 are tracked independently
    // (`highestPerWallet` vs `highestGlobal`), so reuse is safe.
    expect(() =>
      validateRegistry([
        makeMigration({ version: 1, scope: 'per-wallet', name: 'a' }),
        makeMigration({ version: 1, scope: 'global', name: 'b' })
      ])
    ).not.toThrow()
  })

  it('throws on duplicate name', () => {
    expect(() =>
      validateRegistry([
        makeMigration({ version: 1, scope: 'per-wallet', name: 'same' }),
        makeMigration({ version: 2, scope: 'per-wallet', name: 'same' })
      ])
    ).toThrow(/duplicate migration name/)
  })

  it('throws on missing description', () => {
    expect(() =>
      validateRegistry([
        {
          version: 1,
          name: 'm',
          description: '',
          scope: 'per-wallet',
          migrate: async () => ({ outcome: 'applied' as const })
        }
      ])
    ).toThrow(/missing a description/)
  })

  it('throws on missing name', () => {
    expect(() =>
      validateRegistry([
        {
          version: 1,
          name: '',
          description: 'd',
          scope: 'per-wallet',
          migrate: async () => ({ outcome: 'applied' as const })
        }
      ])
    ).toThrow(/missing a name/)
  })

  it('throws on invalid scope', () => {
    expect(() =>
      validateRegistry([
        {
          version: 1,
          name: 'm',
          description: 'd',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          scope: 'invalid' as any,
          migrate: async () => ({ outcome: 'applied' as const })
        }
      ])
    ).toThrow(/invalid scope/)
  })

  it('throws on invalid version (zero or negative)', () => {
    expect(() =>
      validateRegistry([
        makeMigration({ version: 0, scope: 'per-wallet', name: 'm' })
      ])
    ).toThrow(/invalid version/)

    expect(() =>
      validateRegistry([
        makeMigration({ version: -1, scope: 'per-wallet', name: 'm' })
      ])
    ).toThrow(/invalid version/)
  })

  it('throws on missing migrate function', () => {
    expect(() =>
      validateRegistry([
        {
          version: 1,
          name: 'm',
          description: 'd',
          scope: 'per-wallet',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          migrate: undefined as any
        }
      ])
    ).toThrow(/missing a migrate function/)
  })

  it('accepts a valid registry with mixed scopes', () => {
    expect(() =>
      validateRegistry([
        makeMigration({ version: 1, scope: 'per-wallet', name: 'a' }),
        makeMigration({ version: 2, scope: 'global', name: 'b' }),
        makeMigration({ version: 3, scope: 'per-wallet', name: 'c' })
      ])
    ).not.toThrow()
  })

  it('accepts an empty registry', () => {
    expect(() => validateRegistry([])).not.toThrow()
  })
})
