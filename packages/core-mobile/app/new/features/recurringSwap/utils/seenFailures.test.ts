// jest.mock() factory cannot close over out-of-scope `let` variables.
// Use a module-scoped object on `global` so the factory can reference it
// without violating the scope restriction.
const mockMmkvStore: Record<string, string> = {}

jest.mock('utils/mmkv/storages', () => ({
  commonStorage: {
    getString: (k: string) => mockMmkvStore[k],
    set: (k: string, v: string) => {
      mockMmkvStore[k] = v
    }
  }
}))

import {
  loadSeenFailures,
  saveSeenFailures,
  loadAutoCancelled,
  saveAutoCancelled,
  makeFailureKey
} from './seenFailures'

describe('seenFailures', () => {
  beforeEach(() => {
    // Clear the shared mock store before each test
    Object.keys(mockMmkvStore).forEach(k => delete mockMmkvStore[k])
  })

  it('loadSeenFailures returns an empty Set when storage is empty', () => {
    expect(loadSeenFailures().size).toBe(0)
  })

  it('round-trips a Set<string> for seen failures', () => {
    const s = new Set(['a:1', 'b:2'])
    saveSeenFailures(s)
    expect([...loadSeenFailures()].sort()).toEqual(['a:1', 'b:2'])
  })

  it('makeFailureKey composes orderId + executionIndex', () => {
    expect(makeFailureKey('0xdead', 3)).toBe('0xdead:3')
  })

  it('loadAutoCancelled is independent from seenFailures', () => {
    saveSeenFailures(new Set(['a:1']))
    saveAutoCancelled(new Set(['b:cancelled']))
    expect(loadSeenFailures().has('a:1')).toBe(true)
    expect(loadAutoCancelled().has('b:cancelled')).toBe(true)
    expect(loadAutoCancelled().has('a:1')).toBe(false)
  })

  it('handles corrupted JSON gracefully', () => {
    // Write invalid JSON directly into the store
    mockMmkvStore['recurringSwap.seenFailures'] = 'not valid json {'
    expect(loadSeenFailures().size).toBe(0)
  })

  it('handles non-array JSON gracefully', () => {
    // Valid JSON but not an array — the cast to string[] gives wrong shape
    mockMmkvStore['recurringSwap.seenFailures'] = JSON.stringify({ not: 'an array' })
    // new Set({...}) iterates keys, which is fine but semantically wrong —
    // the important thing is that it does NOT throw
    expect(() => loadSeenFailures()).not.toThrow()
  })

  it('loadAutoCancelled returns an empty Set when storage is empty', () => {
    expect(loadAutoCancelled().size).toBe(0)
  })

  it('round-trips a Set<string> for auto-cancelled', () => {
    const s = new Set(['order1:cancelled', 'order2:cancelled'])
    saveAutoCancelled(s)
    expect([...loadAutoCancelled()].sort()).toEqual([
      'order1:cancelled',
      'order2:cancelled'
    ])
  })
})
