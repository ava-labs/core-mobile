import { ListenerMigration, MigrationResult } from './types'
import {
  buildFailureKey,
  emptyStorageState,
  getLatestVersion,
  sanitizeStorageState,
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

describe('sanitizeStorageState', () => {
  it('passes through a well-formed state unchanged', () => {
    const valid = {
      highestPerWallet: { 'wallet-a': 3, 'wallet-b': 5 },
      highestGlobal: 7,
      lastFailures: {
        'wallet-a:4': {
          version: 4,
          name: 'm4',
          scope: 'per-wallet',
          walletId: 'wallet-a',
          errorMessage: 'boom',
          failedAt: 1000,
          attemptCount: 2
        }
      }
    }
    expect(sanitizeStorageState(valid)).toEqual(valid)
  })

  it('returns empty state when the input is not a plain object', () => {
    expect(sanitizeStorageState(null)).toEqual(emptyStorageState())
    expect(sanitizeStorageState(undefined)).toEqual(emptyStorageState())
    expect(sanitizeStorageState(42)).toEqual(emptyStorageState())
    expect(sanitizeStorageState('garbage')).toEqual(emptyStorageState())
    expect(sanitizeStorageState([1, 2, 3])).toEqual(emptyStorageState())
  })

  it('resets `highestPerWallet` to {} when it is not a plain object', () => {
    const result = sanitizeStorageState({
      highestPerWallet: 'not an object',
      highestGlobal: 5,
      lastFailures: {}
    })
    expect(result.highestPerWallet).toEqual({})
    // Other valid fields preserved
    expect(result.highestGlobal).toBe(5)
  })

  it('resets the entire `highestPerWallet` if any single entry is invalid', () => {
    // Whole-field reset (zod `.catch({})` behavior). Trade-off: a single
    // bad entry resets everyone's watermark, but storage corruption is
    // rare and migrations are idempotent so re-running is safe.
    const result = sanitizeStorageState({
      highestPerWallet: {
        'wallet-good': 3,
        'wallet-bad': 'oops'
      }
    })
    expect(result.highestPerWallet).toEqual({})
  })

  it('keeps a `highestPerWallet` where every entry is a non-negative integer', () => {
    const result = sanitizeStorageState({
      highestPerWallet: { 'wallet-a': 0, 'wallet-b': 3, 'wallet-c': 100 }
    })
    expect(result.highestPerWallet).toEqual({
      'wallet-a': 0,
      'wallet-b': 3,
      'wallet-c': 100
    })
  })

  it('resets `highestGlobal` to 0 when it is not a non-negative integer', () => {
    expect(sanitizeStorageState({ highestGlobal: 'oops' }).highestGlobal).toBe(
      0
    )
    expect(sanitizeStorageState({ highestGlobal: -5 }).highestGlobal).toBe(0)
    expect(sanitizeStorageState({ highestGlobal: 1.5 }).highestGlobal).toBe(0)
    expect(sanitizeStorageState({ highestGlobal: NaN }).highestGlobal).toBe(0)
    expect(
      sanitizeStorageState({ highestGlobal: Number.POSITIVE_INFINITY })
        .highestGlobal
    ).toBe(0)
  })

  it('resets `lastFailures` to {} when it is not a plain object', () => {
    expect(sanitizeStorageState({ lastFailures: 'oops' }).lastFailures).toEqual(
      {}
    )
    expect(sanitizeStorageState({ lastFailures: [1, 2] }).lastFailures).toEqual(
      {}
    )
  })

  it('resets the entire `lastFailures` if any single entry is malformed', () => {
    const validRecord = {
      version: 1,
      name: 'm',
      scope: 'per-wallet',
      walletId: 'w',
      errorMessage: 'boom',
      failedAt: 0,
      attemptCount: 1
    }
    const result = sanitizeStorageState({
      lastFailures: { 'good-key': validRecord, 'bad-key': 42 }
    })
    expect(result.lastFailures).toEqual({})
  })

  it('keeps a `lastFailures` where every entry is a valid FailureRecord', () => {
    const validRecord = {
      version: 1,
      name: 'm',
      scope: 'per-wallet',
      walletId: 'w',
      errorMessage: 'boom',
      failedAt: 0,
      attemptCount: 1
    }
    const result = sanitizeStorageState({
      lastFailures: { 'good-key': validRecord }
    })
    expect(result.lastFailures).toEqual({ 'good-key': validRecord })
  })

  it('returned object is freshly owned (mutations do not leak)', () => {
    const a = sanitizeStorageState({})
    a.highestPerWallet['wallet-1'] = 5
    const b = sanitizeStorageState({})
    expect(b.highestPerWallet).toEqual({})
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

  it('throws on non-integer version (decimal, NaN, Infinity)', () => {
    expect(() =>
      validateRegistry([
        makeMigration({ version: 1.5, scope: 'per-wallet', name: 'm' })
      ])
    ).toThrow(/invalid version/)

    expect(() =>
      validateRegistry([
        makeMigration({ version: NaN, scope: 'per-wallet', name: 'm' })
      ])
    ).toThrow(/invalid version/)

    expect(() =>
      validateRegistry([
        makeMigration({
          version: Number.POSITIVE_INFINITY,
          scope: 'per-wallet',
          name: 'm'
        })
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
