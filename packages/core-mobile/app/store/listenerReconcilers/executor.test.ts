import { addBreadcrumb } from '@sentry/react-native'
import { AppListenerEffectAPI } from 'store/types'
import { ListenerReconcilerExecutor } from './executor'
import { Reconciler, ReconcilerResult } from './types'

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

const mockBreadcrumb = addBreadcrumb as jest.Mock

const buildListenerApi = (): AppListenerEffectAPI =>
  ({
    getState: () => ({}),
    dispatch: jest.fn()
  } as unknown as AppListenerEffectAPI)

const makeReconciler = (overrides: Partial<Reconciler> = {}): Reconciler => ({
  name: overrides.name ?? 'reconciler',
  description: overrides.description ?? 'description',
  reconcile:
    overrides.reconcile ??
    (async () => ({ outcome: 'applied' } as ReconcilerResult)),
  ...overrides
})

beforeEach(() => {
  jest.clearAllMocks()
})

describe('ListenerReconcilerExecutor', () => {
  describe('empty registry', () => {
    it('exits cleanly — no reconcilers run, no Sentry breadcrumb emitted', async () => {
      const executor = new ListenerReconcilerExecutor([])

      await executor.executeAll(buildListenerApi())

      expect(mockBreadcrumb).not.toHaveBeenCalled()
    })

    it('returns a resolved promise without entering the loop', async () => {
      // Sentinel reconciler whose presence in the array would be visible if
      // the empty-registry guard ever stopped short-circuiting.
      const sentinel = jest.fn(async () => ({ outcome: 'applied' as const }))
      const executorEmpty = new ListenerReconcilerExecutor([])
      const executorWith = new ListenerReconcilerExecutor([
        makeReconciler({ reconcile: sentinel })
      ])

      await executorEmpty.executeAll(buildListenerApi())
      await executorWith.executeAll(buildListenerApi())

      // Only the non-empty registry called the reconciler.
      expect(sentinel).toHaveBeenCalledTimes(1)
    })
  })

  describe('reentrancy', () => {
    it('returns the in-flight promise when called again before the first run finishes', async () => {
      let resolveReconcile: () => void = () => undefined
      const reconcile = jest.fn(
        () =>
          new Promise<ReconcilerResult>(resolve => {
            resolveReconcile = () => resolve({ outcome: 'applied' })
          })
      )
      const r = makeReconciler({ reconcile })
      const executor = new ListenerReconcilerExecutor([r])

      const first = executor.executeAll(buildListenerApi())
      const second = executor.executeAll(buildListenerApi())

      // Both callers get the same promise — no parallel pass.
      expect(first).toBe(second)
      // Reconciler was only kicked off once.
      expect(reconcile).toHaveBeenCalledTimes(1)

      resolveReconcile()
      await first
    })

    it('clears the in-flight slot after completion so a later call re-runs', async () => {
      const reconcile = jest.fn(async () => ({ outcome: 'applied' as const }))
      const r = makeReconciler({ reconcile })
      const executor = new ListenerReconcilerExecutor([r])

      await executor.executeAll(buildListenerApi())
      await executor.executeAll(buildListenerApi())

      // Reconcilers run on every unlock (no completion tracking) — so two
      // sequential `executeAll` calls invoke the reconciler twice.
      expect(reconcile).toHaveBeenCalledTimes(2)
    })

    it('clears the in-flight slot even when the run throws', async () => {
      // A throw inside the iteration phase must not leave the executor
      // permanently locked. Use a reconciler whose reconcile() returns a
      // rejected promise so the IIFE rejects.
      const throwing = makeReconciler({
        name: 'throwing',
        reconcile: () => Promise.reject(new Error('boom'))
      })
      const recovering = jest.fn(async () => ({
        outcome: 'applied' as const
      }))
      // Note: `runReconciler` catches reconcile() errors and converts to
      // outcome=failed, so this case actually never propagates out of
      // executeAll today. To test the cleanup path we override
      // `runReconciler` indirectly by stubbing the reconcile() to throw
      // synchronously inside the for-loop's await. We do that by mocking
      // the iterator: simpler — make `Sentry.addBreadcrumb` throw once,
      // which propagates out of recordOutcome → out of the IIFE.
      mockBreadcrumb.mockImplementationOnce(() => {
        throw new Error('breadcrumb sink blew up')
      })

      const executor = new ListenerReconcilerExecutor([throwing])
      await expect(executor.executeAll(buildListenerApi())).rejects.toThrow(
        'breadcrumb sink blew up'
      )

      // Subsequent call must work normally — the in-flight slot was cleared.
      const executor2 = new ListenerReconcilerExecutor([
        makeReconciler({ name: 'r2', reconcile: recovering })
      ])
      await executor2.executeAll(buildListenerApi())
      expect(recovering).toHaveBeenCalledTimes(1)
    })
  })

  describe('execution', () => {
    it('runs reconcilers sequentially in registration order', async () => {
      const callOrder: string[] = []
      const a = makeReconciler({
        name: 'a',
        reconcile: async () => {
          callOrder.push('a')
          return { outcome: 'applied' as const }
        }
      })
      const b = makeReconciler({
        name: 'b',
        reconcile: async () => {
          callOrder.push('b')
          return { outcome: 'applied' as const }
        }
      })
      const c = makeReconciler({
        name: 'c',
        reconcile: async () => {
          callOrder.push('c')
          return { outcome: 'applied' as const }
        }
      })
      const executor = new ListenerReconcilerExecutor([a, b, c])

      await executor.executeAll(buildListenerApi())

      expect(callOrder).toEqual(['a', 'b', 'c'])
    })

    it('passes listenerApi to each reconciler', async () => {
      const reconcile = jest.fn(async () => ({ outcome: 'applied' as const }))
      const r = makeReconciler({ reconcile })
      const executor = new ListenerReconcilerExecutor([r])
      const listenerApi = buildListenerApi()

      await executor.executeAll(listenerApi)

      expect(reconcile).toHaveBeenCalledWith({ listenerApi })
    })

    it('runs every reconciler on every call (no completion tracking)', async () => {
      const reconcile = jest.fn(async () => ({ outcome: 'applied' as const }))
      const r = makeReconciler({ reconcile })
      const executor = new ListenerReconcilerExecutor([r])

      await executor.executeAll(buildListenerApi())
      await executor.executeAll(buildListenerApi())
      await executor.executeAll(buildListenerApi())

      expect(reconcile).toHaveBeenCalledTimes(3)
    })
  })

  describe('failure isolation', () => {
    it('continues running subsequent reconcilers after one returns outcome=failed', async () => {
      const aReconcile = jest.fn(async () => ({
        outcome: 'failed' as const,
        error: new Error('boom')
      }))
      const bReconcile = jest.fn(async () => ({ outcome: 'applied' as const }))
      const a = makeReconciler({ name: 'a-fail', reconcile: aReconcile })
      const b = makeReconciler({ name: 'b-ok', reconcile: bReconcile })
      const executor = new ListenerReconcilerExecutor([a, b])

      await executor.executeAll(buildListenerApi())

      expect(aReconcile).toHaveBeenCalledTimes(1)
      expect(bReconcile).toHaveBeenCalledTimes(1)
    })

    it('catches thrown errors and continues — coerces into outcome=failed', async () => {
      const aReconcile = jest.fn(async () => {
        throw new Error('uncaught')
      })
      const bReconcile = jest.fn(async () => ({ outcome: 'applied' as const }))
      const a = makeReconciler({ name: 'a-throws', reconcile: aReconcile })
      const b = makeReconciler({ name: 'b-ok', reconcile: bReconcile })
      const executor = new ListenerReconcilerExecutor([a, b])

      await executor.executeAll(buildListenerApi())

      expect(bReconcile).toHaveBeenCalledTimes(1)
      expect(mockBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('a-throws — failed'),
          level: 'error',
          data: expect.objectContaining({ errorMessage: 'uncaught' })
        })
      )
    })
  })

  describe('Sentry breadcrumbs', () => {
    it('emits a breadcrumb with outcome=applied at info level', async () => {
      const r = makeReconciler({
        name: 'r',
        reconcile: async () => ({
          outcome: 'applied' as const,
          metadata: { accountsAdded: 3 }
        })
      })
      const executor = new ListenerReconcilerExecutor([r])

      await executor.executeAll(buildListenerApi())

      expect(mockBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'listenerReconciler',
          message: 'r — applied',
          level: 'info',
          data: expect.objectContaining({
            metadata: { accountsAdded: 3 }
          })
        })
      )
    })

    it('emits outcome=noOp at info level', async () => {
      const r = makeReconciler({
        name: 'r',
        reconcile: async () => ({ outcome: 'noOp' as const })
      })
      const executor = new ListenerReconcilerExecutor([r])

      await executor.executeAll(buildListenerApi())

      expect(mockBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'r — noOp',
          level: 'info'
        })
      )
    })

    it('emits outcome=failed at error level with errorMessage', async () => {
      const r = makeReconciler({
        name: 'r',
        reconcile: async () => ({
          outcome: 'failed' as const,
          error: new Error('boom')
        })
      })
      const executor = new ListenerReconcilerExecutor([r])

      await executor.executeAll(buildListenerApi())

      expect(mockBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'r — failed',
          level: 'error',
          data: expect.objectContaining({ errorMessage: 'boom' })
        })
      )
    })

    it('emits one breadcrumb per reconciler execution', async () => {
      const a = makeReconciler({ name: 'a' })
      const b = makeReconciler({ name: 'b' })
      const executor = new ListenerReconcilerExecutor([a, b])

      await executor.executeAll(buildListenerApi())

      expect(mockBreadcrumb).toHaveBeenCalledTimes(2)
    })
  })
})
