import { Reconciler, ReconcilerResult } from './types'
import { validateRegistry } from './utils'

const makeReconciler = (overrides: Partial<Reconciler> = {}): Reconciler => ({
  name: overrides.name ?? 'reconciler',
  description: overrides.description ?? 'description',
  reconcile:
    overrides.reconcile ??
    (async () => ({ outcome: 'applied' } as ReconcilerResult)),
  ...overrides
})

describe('validateRegistry', () => {
  it('throws on duplicate name', () => {
    expect(() =>
      validateRegistry([
        makeReconciler({ name: 'same' }),
        makeReconciler({ name: 'same' })
      ])
    ).toThrow(/duplicate reconciler name: same/)
  })

  it('throws on missing name', () => {
    expect(() =>
      validateRegistry([
        {
          name: '',
          description: 'd',
          reconcile: async () => ({ outcome: 'applied' as const })
        }
      ])
    ).toThrow(/missing a name/)
  })

  it('throws on missing description', () => {
    expect(() =>
      validateRegistry([
        {
          name: 'r',
          description: '',
          reconcile: async () => ({ outcome: 'applied' as const })
        }
      ])
    ).toThrow(/missing a description/)
  })

  it('throws on missing reconcile function', () => {
    expect(() =>
      validateRegistry([
        {
          name: 'r',
          description: 'd',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          reconcile: undefined as any
        }
      ])
    ).toThrow(/missing a reconcile function/)
  })

  it('accepts an empty registry', () => {
    expect(() => validateRegistry([])).not.toThrow()
  })

  it('accepts a registry of distinct reconcilers', () => {
    expect(() =>
      validateRegistry([
        makeReconciler({ name: 'a' }),
        makeReconciler({ name: 'b' }),
        makeReconciler({ name: 'c' })
      ])
    ).not.toThrow()
  })
})
