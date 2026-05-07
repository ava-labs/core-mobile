import { addBreadcrumb } from '@sentry/react-native'
import { AppListenerEffectAPI } from 'store/types'
import { Wallet } from 'store/wallet/types'
import { WalletType } from 'services/wallet/types'
import { selectActiveWallet, selectWallets } from 'store/wallet/slice'
import { ListenerMigrationExecutor } from './executor'
import { MigrationStateStorage } from './storage'
import {
  ListenerMigration,
  ListenerMigrationStorageState,
  MigrationResult
} from './types'
import { emptyStorageState } from './utils'

jest.mock('store/wallet/slice')
jest.mock('@sentry/react-native', () => ({
  addBreadcrumb: jest.fn(),
  init: jest.fn(),
  reactNavigationIntegration: jest.fn(() => ({})),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  withScope: jest.fn(
    (cb: (scope: { setContext: jest.Mock; setTags: jest.Mock }) => void) =>
      cb({ setContext: jest.fn(), setTags: jest.fn() })
  ),
  getGlobalScope: jest.fn(() => ({ setUser: jest.fn() }))
}))

const mockSelectWallets = selectWallets as jest.Mock
const mockSelectActiveWallet = selectActiveWallet as jest.Mock
const mockBreadcrumb = addBreadcrumb as jest.Mock

const buildWallet = (
  id: string,
  type: WalletType = WalletType.MNEMONIC
): Wallet => ({
  id,
  name: `wallet ${id}`,
  type
})

/**
 * In-memory implementation of `MigrationStateStorage` for tests. Holds the
 * state object directly and clones on save to avoid accidental sharing.
 */
class InMemoryMigrationStateStorage implements MigrationStateStorage {
  private state: ListenerMigrationStorageState = emptyStorageState()

  load(): ListenerMigrationStorageState {
    return JSON.parse(JSON.stringify(this.state))
  }

  save(state: ListenerMigrationStorageState): void {
    this.state = JSON.parse(JSON.stringify(state))
  }
}

const buildListenerApi = (): AppListenerEffectAPI =>
  ({
    getState: () => ({}),
    dispatch: jest.fn()
  } as unknown as AppListenerEffectAPI)

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

const setWalletState = (
  wallets: Wallet[],
  activeWalletId: string | undefined
): void => {
  const walletMap = wallets.reduce<Record<string, Wallet>>((acc, w) => {
    acc[w.id] = w
    return acc
  }, {})
  mockSelectWallets.mockReturnValue(walletMap)
  mockSelectActiveWallet.mockReturnValue(
    activeWalletId ? walletMap[activeWalletId] : undefined
  )
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('ListenerMigrationExecutor', () => {
  describe('empty registry', () => {
    it('exits cleanly — no migrations run, no Sentry breadcrumb emitted', async () => {
      const storage = new InMemoryMigrationStateStorage()
      const executor = new ListenerMigrationExecutor(storage, [])

      setWalletState([buildWallet('w1')], 'w1')
      await executor.executePendingMigrations(buildListenerApi())

      expect(executor.getCurrentFailures()).toEqual([])
      expect(mockBreadcrumb).not.toHaveBeenCalled()
    })

    it('skips redux selectors entirely when registry is empty', async () => {
      const storage = new InMemoryMigrationStateStorage()
      const executor = new ListenerMigrationExecutor(storage, [])

      await executor.executePendingMigrations(buildListenerApi())

      // Empty-registry guard short-circuits before reaching the selectors.
      expect(mockSelectActiveWallet).not.toHaveBeenCalled()
      expect(mockSelectWallets).not.toHaveBeenCalled()
    })
  })

  describe('reentrancy', () => {
    it('returns the in-flight promise when called again before the first run finishes', async () => {
      let resolveMigrate: () => void = () => undefined
      const migrate = jest.fn(
        () =>
          new Promise<MigrationResult>(resolve => {
            resolveMigrate = () => resolve({ outcome: 'applied' })
          })
      )
      const m1 = makeMigration({
        version: 1,
        scope: 'per-wallet',
        name: 'm1',
        migrate
      })
      const storage = new InMemoryMigrationStateStorage()
      const executor = new ListenerMigrationExecutor(storage, [m1])

      setWalletState([buildWallet('w1')], 'w1')
      const first = executor.executePendingMigrations(buildListenerApi())
      const second = executor.executePendingMigrations(buildListenerApi())

      // Both callers get the same promise — no parallel pass.
      expect(first).toBe(second)
      // Migration was only kicked off once.
      expect(migrate).toHaveBeenCalledTimes(1)

      resolveMigrate()
      await first
    })

    it('clears the in-flight slot after completion so a later call re-runs', async () => {
      const migrate = jest.fn(async () => ({ outcome: 'applied' as const }))
      const m1 = makeMigration({
        version: 1,
        scope: 'per-wallet',
        name: 'm1',
        migrate
      })
      const storage = new InMemoryMigrationStateStorage()
      const executor = new ListenerMigrationExecutor(storage, [m1])

      setWalletState([buildWallet('w1'), buildWallet('w2')], 'w1')
      await executor.executePendingMigrations(buildListenerApi())
      // After the first finishes, a second call against a not-yet-migrated
      // wallet should proceed normally (in-flight slot was cleared).
      await executor.executePendingMigrations(buildListenerApi())

      // 2 wallets × 1 pass = 2 invocations (second pass is a no-op since
      // both wallets were marked complete on the first pass).
      expect(migrate).toHaveBeenCalledTimes(2)
    })

    it('clears the in-flight slot even when the run throws', async () => {
      // A throw inside the wallet-iteration phase (e.g. selector blowing up)
      // must not leave the executor permanently locked.
      const storage = new InMemoryMigrationStateStorage()
      const executor = new ListenerMigrationExecutor(storage, [
        makeMigration({ version: 1, scope: 'per-wallet', name: 'm1' })
      ])

      mockSelectWallets.mockImplementationOnce(() => {
        throw new Error('selector blew up')
      })
      mockSelectActiveWallet.mockReturnValueOnce(undefined)

      await expect(
        executor.executePendingMigrations(buildListenerApi())
      ).rejects.toThrow('selector blew up')

      // Subsequent call must work normally — the in-flight slot was cleared.
      setWalletState([buildWallet('w1')], 'w1')
      await executor.executePendingMigrations(buildListenerApi())
      expect(executor.getHighestCompletedVersion('per-wallet', 'w1')).toBe(1)
    })
  })

  describe('per-wallet migrations', () => {
    it('runs migrations in ascending version order for each wallet', async () => {
      const callOrder: string[] = []
      const m1 = makeMigration({
        version: 1,
        scope: 'per-wallet',
        name: 'm1',
        migrate: async ctx => {
          callOrder.push(`m1:${ctx.walletId}`)
          return { outcome: 'applied' as const }
        }
      })
      const m2 = makeMigration({
        version: 2,
        scope: 'per-wallet',
        name: 'm2',
        migrate: async ctx => {
          callOrder.push(`m2:${ctx.walletId}`)
          return { outcome: 'applied' as const }
        }
      })

      const storage = new InMemoryMigrationStateStorage()
      const executor = new ListenerMigrationExecutor(storage, [m2, m1])

      setWalletState([buildWallet('w1'), buildWallet('w2')], 'w1')
      await executor.executePendingMigrations(buildListenerApi())

      // Active wallet first, then others. Within each wallet, ascending.
      expect(callOrder).toEqual(['m1:w1', 'm2:w1', 'm1:w2', 'm2:w2'])
    })

    it('skips migrations already completed for a wallet on subsequent runs', async () => {
      const migrate = jest.fn(async () => ({ outcome: 'applied' as const }))
      const m1 = makeMigration({
        version: 1,
        scope: 'per-wallet',
        name: 'm1',
        migrate
      })
      const storage = new InMemoryMigrationStateStorage()
      const executor = new ListenerMigrationExecutor(storage, [m1])

      setWalletState([buildWallet('w1')], 'w1')
      await executor.executePendingMigrations(buildListenerApi())
      await executor.executePendingMigrations(buildListenerApi())

      expect(migrate).toHaveBeenCalledTimes(1)
    })

    it('records keyed per (walletId, version) — different wallets run independently', async () => {
      const migrate = jest.fn(async () => ({ outcome: 'applied' as const }))
      const m1 = makeMigration({
        version: 1,
        scope: 'per-wallet',
        name: 'm1',
        migrate
      })
      const storage = new InMemoryMigrationStateStorage()
      const executor = new ListenerMigrationExecutor(storage, [m1])

      setWalletState([buildWallet('w1'), buildWallet('w2')], 'w1')
      await executor.executePendingMigrations(buildListenerApi())

      expect(migrate).toHaveBeenCalledTimes(2)
      expect(executor.getHighestCompletedVersion('per-wallet', 'w1')).toBe(1)
      expect(executor.getHighestCompletedVersion('per-wallet', 'w2')).toBe(1)
    })
  })

  describe('global migrations', () => {
    it('runs once per onAppUnlocked regardless of wallet count', async () => {
      const migrate = jest.fn(async () => ({ outcome: 'applied' as const }))
      const m1 = makeMigration({
        version: 1,
        scope: 'global',
        name: 'global-1',
        migrate
      })
      const storage = new InMemoryMigrationStateStorage()
      const executor = new ListenerMigrationExecutor(storage, [m1])

      setWalletState(
        [buildWallet('w1'), buildWallet('w2'), buildWallet('w3')],
        'w1'
      )
      await executor.executePendingMigrations(buildListenerApi())

      expect(migrate).toHaveBeenCalledTimes(1)
      expect(executor.getHighestCompletedVersion('global')).toBe(1)
    })

    it('does not re-run completed global migrations on subsequent unlocks', async () => {
      const migrate = jest.fn(async () => ({ outcome: 'applied' as const }))
      const m1 = makeMigration({
        version: 1,
        scope: 'global',
        name: 'global-1',
        migrate
      })
      const storage = new InMemoryMigrationStateStorage()
      const executor = new ListenerMigrationExecutor(storage, [m1])

      setWalletState([buildWallet('w1')], 'w1')
      await executor.executePendingMigrations(buildListenerApi())
      await executor.executePendingMigrations(buildListenerApi())

      expect(migrate).toHaveBeenCalledTimes(1)
    })
  })

  describe('failure handling', () => {
    it('halts subsequent migrations within a scope after one fails (so the failed version retries next unlock)', async () => {
      const m1 = makeMigration({
        version: 1,
        scope: 'per-wallet',
        name: 'fail-1',
        migrate: async () => ({
          outcome: 'failed' as const,
          error: new Error('boom')
        })
      })
      const m2Migrate = jest.fn(async () => ({ outcome: 'applied' as const }))
      const m2 = makeMigration({
        version: 2,
        scope: 'per-wallet',
        name: 'ok-2',
        migrate: m2Migrate
      })
      const storage = new InMemoryMigrationStateStorage()
      const executor = new ListenerMigrationExecutor(storage, [m1, m2])

      setWalletState([buildWallet('w1')], 'w1')
      await executor.executePendingMigrations(buildListenerApi())

      // v2 must NOT run while v1 is broken — otherwise highestPerWallet
      // would advance past v1 and v1 would never be retried.
      expect(m2Migrate).not.toHaveBeenCalled()
      expect(executor.getHighestCompletedVersion('per-wallet', 'w1')).toBe(0)
      expect(executor.getCurrentFailures()).toHaveLength(1)
      expect(executor.getCurrentFailures()[0]?.version).toBe(1)
    })

    it('isolates failure per wallet — a failure in wallet A does not block wallet B', async () => {
      const m1 = makeMigration({
        version: 1,
        scope: 'per-wallet',
        name: 'm1',
        migrate: async ctx =>
          ctx.walletId === 'w-broken'
            ? { outcome: 'failed' as const, error: new Error('boom') }
            : { outcome: 'applied' as const }
      })
      const storage = new InMemoryMigrationStateStorage()
      const executor = new ListenerMigrationExecutor(storage, [m1])

      setWalletState([buildWallet('w-broken'), buildWallet('w-ok')], 'w-broken')
      await executor.executePendingMigrations(buildListenerApi())

      expect(
        executor.getHighestCompletedVersion('per-wallet', 'w-broken')
      ).toBe(0)
      expect(executor.getHighestCompletedVersion('per-wallet', 'w-ok')).toBe(1)
      expect(executor.getCurrentFailures()).toHaveLength(1)
    })

    it('does not advance per-wallet completed version past a failed migration', async () => {
      const m1 = makeMigration({ version: 1, scope: 'per-wallet', name: 'm1' })
      const m2 = makeMigration({
        version: 2,
        scope: 'per-wallet',
        name: 'm2-fails',
        migrate: async () => ({
          outcome: 'failed' as const,
          error: new Error('boom')
        })
      })
      const m3Migrate = jest.fn(async () => ({ outcome: 'applied' as const }))
      const m3 = makeMigration({
        version: 3,
        scope: 'per-wallet',
        name: 'm3',
        migrate: m3Migrate
      })
      const storage = new InMemoryMigrationStateStorage()
      const executor = new ListenerMigrationExecutor(storage, [m1, m2, m3])

      setWalletState([buildWallet('w1')], 'w1')
      await executor.executePendingMigrations(buildListenerApi())

      expect(m3Migrate).not.toHaveBeenCalled()
      expect(executor.getHighestCompletedVersion('per-wallet', 'w1')).toBe(1)
    })

    it('persists highest successfully completed version even if a later migration fails', async () => {
      const m1 = makeMigration({ version: 1, scope: 'per-wallet', name: 'm1' })
      const m2 = makeMigration({ version: 2, scope: 'per-wallet', name: 'm2' })
      const m3 = makeMigration({
        version: 3,
        scope: 'per-wallet',
        name: 'm3-fails',
        migrate: async () => ({
          outcome: 'failed' as const,
          error: new Error('boom')
        })
      })
      const storage = new InMemoryMigrationStateStorage()
      const executor = new ListenerMigrationExecutor(storage, [m1, m2, m3])

      setWalletState([buildWallet('w1')], 'w1')
      await executor.executePendingMigrations(buildListenerApi())

      expect(executor.getHighestCompletedVersion('per-wallet', 'w1')).toBe(2)
    })

    it('catches thrown errors from migrate() and records as a current failure', async () => {
      const m1 = makeMigration({
        version: 1,
        scope: 'per-wallet',
        name: 'throws',
        migrate: async () => {
          throw new Error('uncaught')
        }
      })
      const storage = new InMemoryMigrationStateStorage()
      const executor = new ListenerMigrationExecutor(storage, [m1])

      setWalletState([buildWallet('w1')], 'w1')
      await executor.executePendingMigrations(buildListenerApi())

      const failures = executor.getCurrentFailures()
      expect(failures).toHaveLength(1)
      expect(failures[0]).toMatchObject({
        version: 1,
        name: 'throws',
        scope: 'per-wallet',
        walletId: 'w1',
        errorMessage: 'uncaught',
        attemptCount: 1
      })
    })

    it('replaces the failure record on retry and bumps attemptCount', async () => {
      const m1 = makeMigration({
        version: 1,
        scope: 'per-wallet',
        name: 'flaky',
        migrate: async () => ({
          outcome: 'failed' as const,
          error: new Error('boom')
        })
      })
      const storage = new InMemoryMigrationStateStorage()
      const executor = new ListenerMigrationExecutor(storage, [m1])

      setWalletState([buildWallet('w1')], 'w1')
      await executor.executePendingMigrations(buildListenerApi())
      await executor.executePendingMigrations(buildListenerApi())
      await executor.executePendingMigrations(buildListenerApi())

      const failures = executor.getCurrentFailures()
      expect(failures).toHaveLength(1) // still one record, not three
      expect(failures[0]?.attemptCount).toBe(3)
    })

    it('clears the failure record once the migration succeeds', async () => {
      let shouldFail = true
      const m1 = makeMigration({
        version: 1,
        scope: 'per-wallet',
        name: 'recovers',
        migrate: async () =>
          shouldFail
            ? { outcome: 'failed' as const, error: new Error('temporary') }
            : { outcome: 'applied' as const }
      })
      const storage = new InMemoryMigrationStateStorage()
      const executor = new ListenerMigrationExecutor(storage, [m1])

      setWalletState([buildWallet('w1')], 'w1')
      await executor.executePendingMigrations(buildListenerApi())
      expect(executor.getCurrentFailures()).toHaveLength(1)

      shouldFail = false
      await executor.executePendingMigrations(buildListenerApi())
      expect(executor.getCurrentFailures()).toEqual([])
      expect(executor.getHighestCompletedVersion('per-wallet', 'w1')).toBe(1)
    })
  })

  describe('cross-scope behavior', () => {
    it('runs per-wallet migrations before global migrations', async () => {
      const callOrder: string[] = []
      const perWallet = makeMigration({
        version: 1,
        scope: 'per-wallet',
        name: 'pw',
        migrate: async ctx => {
          callOrder.push(`pw:${ctx.walletId}`)
          return { outcome: 'applied' as const }
        }
      })
      const global = makeMigration({
        version: 2,
        scope: 'global',
        name: 'gl',
        migrate: async () => {
          callOrder.push('gl')
          return { outcome: 'applied' as const }
        }
      })
      const storage = new InMemoryMigrationStateStorage()
      const executor = new ListenerMigrationExecutor(storage, [
        perWallet,
        global
      ])

      setWalletState([buildWallet('w1'), buildWallet('w2')], 'w1')
      await executor.executePendingMigrations(buildListenerApi())

      expect(callOrder).toEqual(['pw:w1', 'pw:w2', 'gl'])
    })

    it('a per-wallet failure does not block the global scope from running', async () => {
      const failingPerWallet = makeMigration({
        version: 1,
        scope: 'per-wallet',
        name: 'pw-fail',
        migrate: async () => ({
          outcome: 'failed' as const,
          error: new Error('boom')
        })
      })
      const globalMigrate = jest.fn(async () => ({
        outcome: 'applied' as const
      }))
      const global = makeMigration({
        version: 2,
        scope: 'global',
        name: 'gl',
        migrate: globalMigrate
      })
      const storage = new InMemoryMigrationStateStorage()
      const executor = new ListenerMigrationExecutor(storage, [
        failingPerWallet,
        global
      ])

      setWalletState([buildWallet('w1')], 'w1')
      await executor.executePendingMigrations(buildListenerApi())

      expect(globalMigrate).toHaveBeenCalledTimes(1)
      expect(executor.getHighestCompletedVersion('global')).toBe(2)
    })
  })

  describe('initializeNewWallet', () => {
    it('marks all per-wallet migrations as completed for a newly-created wallet', () => {
      const migrations = [
        makeMigration({ version: 1, scope: 'per-wallet', name: 'm1' }),
        makeMigration({ version: 2, scope: 'per-wallet', name: 'm2' }),
        makeMigration({ version: 3, scope: 'global', name: 'g3' })
      ]
      const storage = new InMemoryMigrationStateStorage()
      const executor = new ListenerMigrationExecutor(storage, migrations)

      executor.initializeNewWallet('w-new')

      expect(executor.getHighestCompletedVersion('per-wallet', 'w-new')).toBe(2)
      // Global migration should NOT be marked complete by per-wallet initialization
      expect(executor.getHighestCompletedVersion('global')).toBe(0)
    })

    it('skips initialized wallet on next unlock — no migrations run', async () => {
      const migrate = jest.fn(async () => ({ outcome: 'applied' as const }))
      const m1 = makeMigration({
        version: 1,
        scope: 'per-wallet',
        name: 'm1',
        migrate
      })
      const storage = new InMemoryMigrationStateStorage()
      const executor = new ListenerMigrationExecutor(storage, [m1])

      executor.initializeNewWallet('w-new')
      setWalletState([buildWallet('w-new')], 'w-new')
      await executor.executePendingMigrations(buildListenerApi())

      expect(migrate).not.toHaveBeenCalled()
    })
  })

  describe('Sentry breadcrumbs', () => {
    it('emits a breadcrumb with outcome=applied on success', async () => {
      const m1 = makeMigration({ version: 1, scope: 'per-wallet', name: 'm1' })
      const storage = new InMemoryMigrationStateStorage()
      const executor = new ListenerMigrationExecutor(storage, [m1])

      setWalletState([buildWallet('w1')], 'w1')
      await executor.executePendingMigrations(buildListenerApi())

      expect(mockBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'listenerMigration',
          message: 'm1 (v1) — applied',
          level: 'info',
          data: expect.objectContaining({
            scope: 'per-wallet',
            walletId: 'w1'
          })
        })
      )
    })

    it('emits outcome=noOp when migration returns outcome: noOp', async () => {
      const m1 = makeMigration({
        version: 1,
        scope: 'per-wallet',
        name: 'm1',
        migrate: async () => ({ outcome: 'noOp' as const })
      })
      const storage = new InMemoryMigrationStateStorage()
      const executor = new ListenerMigrationExecutor(storage, [m1])

      setWalletState([buildWallet('w1')], 'w1')
      await executor.executePendingMigrations(buildListenerApi())

      expect(mockBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('noOp'),
          level: 'info'
        })
      )
    })

    it('emits outcome=failed at error level on failure', async () => {
      const m1 = makeMigration({
        version: 1,
        scope: 'per-wallet',
        name: 'm1',
        migrate: async () => ({
          outcome: 'failed' as const,
          error: new Error('boom')
        })
      })
      const storage = new InMemoryMigrationStateStorage()
      const executor = new ListenerMigrationExecutor(storage, [m1])

      setWalletState([buildWallet('w1')], 'w1')
      await executor.executePendingMigrations(buildListenerApi())

      expect(mockBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('failed'),
          level: 'error',
          data: expect.objectContaining({ errorMessage: 'boom' })
        })
      )
    })
  })
})
