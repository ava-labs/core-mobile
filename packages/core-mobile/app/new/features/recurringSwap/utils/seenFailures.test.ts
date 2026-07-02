// jest.mock() factory cannot close over out-of-scope `let` variables.
// Use a module-scoped object so the factory can reference it without
// violating the scope restriction.
const mockMmkvStore: Record<string, string | boolean> = {}

jest.mock('utils/mmkv/storages', () => ({
  commonStorage: {
    getString: (k: string) => {
      const v = mockMmkvStore[k]
      return typeof v === 'string' ? v : undefined
    },
    getBoolean: (k: string) => {
      const v = mockMmkvStore[k]
      return typeof v === 'boolean' ? v : undefined
    },
    set: (k: string, v: string | boolean) => {
      mockMmkvStore[k] = v
    }
  }
}))

jest.mock('utils/Logger', () => ({
  __esModule: true,
  default: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn()
  }
}))

import {
  isSeenFailuresInitialised,
  loadSeenFailures,
  saveSeenFailures,
  makeFailureKey
} from './seenFailures'

const ACCOUNT_A = '0xAAA0000000000000000000000000000000000001'
const ACCOUNT_B = '0xBBB0000000000000000000000000000000000002'
const CHAIN_AVAX = 43114
const CHAIN_ETH = 1

const entriesKey = (addr: string, chainId: number): string =>
  `recurringSwap.seenFailures.${addr.toLowerCase()}.${chainId}`

describe('seenFailures', () => {
  beforeEach(() => {
    // Clear the shared mock store before each test
    Object.keys(mockMmkvStore).forEach(k => delete mockMmkvStore[k])
  })

  it('loadSeenFailures returns an empty Set when storage is empty', () => {
    expect(loadSeenFailures(ACCOUNT_A, CHAIN_AVAX).size).toBe(0)
  })

  it('isSeenFailuresInitialised returns false on a fresh (account, chain)', () => {
    expect(isSeenFailuresInitialised(ACCOUNT_A, CHAIN_AVAX)).toBe(false)
  })

  it('round-trips a Set<string> for seen failures and flips initialised=true', () => {
    const s = new Set(['a:1', 'b:2'])
    saveSeenFailures(ACCOUNT_A, CHAIN_AVAX, s)
    expect([...loadSeenFailures(ACCOUNT_A, CHAIN_AVAX)].sort()).toEqual([
      'a:1',
      'b:2'
    ])
    expect(isSeenFailuresInitialised(ACCOUNT_A, CHAIN_AVAX)).toBe(true)
  })

  it('scopes the persisted set per-account (no cross-leak)', () => {
    saveSeenFailures(ACCOUNT_A, CHAIN_AVAX, new Set(['a:1']))
    saveSeenFailures(ACCOUNT_B, CHAIN_AVAX, new Set(['b:1']))
    expect([...loadSeenFailures(ACCOUNT_A, CHAIN_AVAX)]).toEqual(['a:1'])
    expect([...loadSeenFailures(ACCOUNT_B, CHAIN_AVAX)]).toEqual(['b:1'])
  })

  it('scopes the persisted set per-chain (no cross-chain leak)', () => {
    saveSeenFailures(ACCOUNT_A, CHAIN_AVAX, new Set(['a:1']))
    saveSeenFailures(ACCOUNT_A, CHAIN_ETH, new Set(['e:1']))
    expect([...loadSeenFailures(ACCOUNT_A, CHAIN_AVAX)]).toEqual(['a:1'])
    expect([...loadSeenFailures(ACCOUNT_A, CHAIN_ETH)]).toEqual(['e:1'])
    expect(isSeenFailuresInitialised(ACCOUNT_A, CHAIN_AVAX)).toBe(true)
    expect(isSeenFailuresInitialised(ACCOUNT_A, CHAIN_ETH)).toBe(true)
  })

  it('treats addresses case-insensitively (so checksum casing does not split storage)', () => {
    saveSeenFailures(ACCOUNT_A.toLowerCase(), CHAIN_AVAX, new Set(['a:1']))
    expect([...loadSeenFailures(ACCOUNT_A.toUpperCase(), CHAIN_AVAX)]).toEqual([
      'a:1'
    ])
  })

  it('makeFailureKey composes orderId + executionIndex', () => {
    expect(makeFailureKey('0xdead', 3)).toBe('0xdead:3')
  })

  // `loadArrayFromStorage` already returns [] on JSON parse failure; the
  // init check (separate boolean key) stays false because saveSeenFailures
  // never ran to set it.
  it('handles corrupted JSON gracefully', () => {
    mockMmkvStore[entriesKey(ACCOUNT_A, CHAIN_AVAX)] = 'not valid json {'
    expect(loadSeenFailures(ACCOUNT_A, CHAIN_AVAX).size).toBe(0)
    expect(isSeenFailuresInitialised(ACCOUNT_A, CHAIN_AVAX)).toBe(false)
  })

  // Defensive guard against a non-array shape sneaking past the loader's
  // type cast (e.g. a stale write from a prior build's wrapped object).
  it('handles a non-array JSON value gracefully', () => {
    mockMmkvStore[entriesKey(ACCOUNT_A, CHAIN_AVAX)] = JSON.stringify({
      unrelated: 'shape'
    })
    expect(loadSeenFailures(ACCOUNT_A, CHAIN_AVAX).size).toBe(0)
    expect(isSeenFailuresInitialised(ACCOUNT_A, CHAIN_AVAX)).toBe(false)
  })

  // Defends the Set constructor against a tampered MMKV value whose array
  // contains non-string entries. The loader filters them out so callers
  // never see them.
  it('filters out non-string entries from a tampered persisted array', () => {
    mockMmkvStore[entriesKey(ACCOUNT_A, CHAIN_AVAX)] = JSON.stringify([
      'a:1',
      42,
      null,
      'b:2'
    ])
    expect([...loadSeenFailures(ACCOUNT_A, CHAIN_AVAX)].sort()).toEqual([
      'a:1',
      'b:2'
    ])
  })

  // The init-flag write is the one MMKV call on the save path without an
  // existing try/catch (saveArrayToStorage swallows its own errors). If
  // it ever throws, we want the persistence failure logged — silently
  // letting it through would mean the next refetch re-enters the silent-
  // seed path and suppresses snackbars for genuinely new failures.
  it('swallows and logs an init-flag MMKV write failure (does not propagate)', () => {
    const Logger = require('utils/Logger').default as {
      error: jest.Mock
    }
    Logger.error.mockClear()
    // Make the next `set` throw — the entries write happens first via
    // saveArrayToStorage's own try/catch, so a single throw lands on the
    // init-flag write.
    const realSet = mockMmkvStore as Record<string, string | boolean>
    const setSpy = jest
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .spyOn(require('utils/mmkv/storages').commonStorage as any, 'set')
      .mockImplementationOnce(() => {
        // first call (entries) succeeds via real impl
        realSet[entriesKey(ACCOUNT_A, CHAIN_AVAX)] = '[]'
      })
      .mockImplementationOnce(() => {
        // second call (init flag) throws
        throw new Error('MMKV write failed')
      })

    expect(() =>
      saveSeenFailures(ACCOUNT_A, CHAIN_AVAX, new Set(['a:1']))
    ).not.toThrow()
    expect(Logger.error).toHaveBeenCalledWith(
      '[seenFailures] init-flag persistence failed',
      expect.any(Error)
    )

    setSpy.mockRestore()
  })

  it('caps growth at MAX_SEEN_FAILURES, evicting oldest insertions', () => {
    // The cap is 1000 in the production code. Seed with > cap entries (1001)
    // and verify only the last 1000 survive a round-trip.
    const entries: string[] = []
    for (let i = 0; i < 1001; i++) entries.push(`order:${i}`)
    saveSeenFailures(ACCOUNT_A, CHAIN_AVAX, new Set(entries))
    const loaded = loadSeenFailures(ACCOUNT_A, CHAIN_AVAX)
    expect(loaded.size).toBe(1000)
    // The oldest (`order:0`) was trimmed; the newest (`order:1000`) survived.
    expect(loaded.has('order:0')).toBe(false)
    expect(loaded.has('order:1000')).toBe(true)
  })
})
