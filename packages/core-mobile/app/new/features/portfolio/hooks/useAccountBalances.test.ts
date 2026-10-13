import { renderHook } from '@testing-library/react-hooks'
import { createBalanceBatcher, useAccountBalances } from './useAccountBalances'

const mockQueryClient = {
  setQueryData: jest.fn(),
  getQueryData: jest.fn()
}

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
  useQueryClient: () => mockQueryClient
}))

jest.mock('react-redux', () => ({
  useSelector: (fn: () => unknown) => fn()
}))

let mockEnabledNetworks: { chainId: number }[] = [
  { chainId: 1 },
  { chainId: 2 }
]

jest.mock('store/network/slice', () => ({
  selectEnabledNetworks: () => mockEnabledNetworks
}))
jest.mock('store/wallet/slice', () => ({
  selectWalletById: () => () => ({ id: 'wallet-1', type: 'mnemonic' })
}))
jest.mock('store/settings/currency/slice', () => ({
  selectSelectedCurrency: () => 'USD'
}))
jest.mock('store/settings/advanced/filterSmallUtxosActive', () => ({
  selectIsFilterSmallUtxosActive: () => false
}))
jest.mock('hooks/useXPAddresses/useXPAddresses', () => ({
  useXPAddresses: () => ({ xpAddresses: [] })
}))
jest.mock('common/hooks/useOnlineStatus', () => ({
  useOnlineStatus: () => true
}))
jest.mock('services/balance/BalanceService', () => ({
  __esModule: true,
  default: { getBalancesForAccount: jest.fn() }
}))
jest.mock('utils/getAddressesFromXpubXP/getAddressesFromXpubXP', () => ({
  getXpubXPIfAvailable: jest.fn()
}))
jest.mock('../store', () => ({
  useIsRefetchingAccountBalances: () => [{}, jest.fn()]
}))

const { useQuery } = jest.requireMock('@tanstack/react-query')

const account = { id: 'acc-1', walletId: 'wallet-1', index: 0 } as never
const accountB = { id: 'acc-2', walletId: 'wallet-1', index: 1 } as never

describe('useAccountBalances isLoading gate', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockEnabledNetworks = [{ chainId: 1 }, { chainId: 2 }]
  })

  it('stays loading while a fetch is still in flight and data is incomplete', () => {
    useQuery.mockReturnValue({
      data: [{ chainId: 1, tokens: [], dataAccurate: true, error: null }],
      isFetching: true,
      isError: false,
      isPaused: false,
      refetch: jest.fn()
    })

    const { result } = renderHook(() => useAccountBalances(account))

    expect(result.current.isLoading).toBe(true)
  })

  it('counts a network that never reports back as resolved once the fetch settles, instead of sticking forever', () => {
    // Simulates the real-world hazard this fix targets: one enabled network
    // (chainId 2) never produces a success OR error entry in `data`, so
    // `data.length` (1) never catches up to `enabledNetworks.length` (2).
    useQuery.mockReturnValue({
      data: [{ chainId: 1, tokens: [], dataAccurate: true, error: null }],
      isFetching: true,
      isError: false,
      isPaused: false,
      refetch: jest.fn()
    })

    const { result, rerender } = renderHook(() => useAccountBalances(account))
    expect(result.current.isLoading).toBe(true)

    // BalanceService's promise (with all internal per-network retries)
    // settles: react-query flips isFetching back to false, but the missing
    // network's entry never arrived.
    useQuery.mockReturnValue({
      data: [{ chainId: 1, tokens: [], dataAccurate: true, error: null }],
      isFetching: false,
      isError: false,
      isPaused: false,
      refetch: jest.fn()
    })
    rerender()

    expect(result.current.isLoading).toBe(false)
  })

  it('happy path: isLoading clears as soon as every enabled network has an entry (output-identical)', () => {
    useQuery.mockReturnValue({
      data: [
        { chainId: 1, tokens: [], dataAccurate: true, error: null },
        { chainId: 2, tokens: [], dataAccurate: true, error: null }
      ],
      isFetching: false,
      isError: false,
      isPaused: false,
      refetch: jest.fn()
    })

    const { result } = renderHook(() => useAccountBalances(account))

    expect(result.current.isLoading).toBe(false)
  })

  it('does not reopen once settled, even across a later refetchInterval poll with the same network still missing', () => {
    // This is the property the settle latch exists for. A naive
    // `isLoading = isFetching` (no latch) would pass every other test above
    // but fails this one: chainId 2 never arrives on the FIRST fetch attempt
    // either, so once react-query starts its next periodic `refetchInterval`
    // poll (isFetching flips true again) a no-latch gate reopens the shimmer
    // — exactly the flicker-forever regression the latch is meant to avoid.
    useQuery.mockReturnValue({
      data: [{ chainId: 1, tokens: [], dataAccurate: true, error: null }],
      isFetching: true,
      isError: false,
      isPaused: false,
      refetch: jest.fn()
    })
    const { result, rerender } = renderHook(() => useAccountBalances(account))
    expect(result.current.isLoading).toBe(true)

    // First fetch attempt settles; chainId 2 never showed up.
    useQuery.mockReturnValue({
      data: [{ chainId: 1, tokens: [], dataAccurate: true, error: null }],
      isFetching: false,
      isError: false,
      isPaused: false,
      refetch: jest.fn()
    })
    rerender()
    expect(result.current.isLoading).toBe(false)

    // A later refetchInterval tick starts a new background fetch attempt —
    // isFetching flips true again — for the SAME query (same account, same
    // enabled-network set). chainId 2 is still missing from `data`.
    useQuery.mockReturnValue({
      data: [{ chainId: 1, tokens: [], dataAccurate: true, error: null }],
      isFetching: true,
      isError: false,
      isPaused: false,
      refetch: jest.fn()
    })
    rerender()
    expect(result.current.isLoading).toBe(false)

    // ...and settles again the same way. Still false throughout.
    useQuery.mockReturnValue({
      data: [{ chainId: 1, tokens: [], dataAccurate: true, error: null }],
      isFetching: false,
      isError: false,
      isPaused: false,
      refetch: jest.fn()
    })
    rerender()
    expect(result.current.isLoading).toBe(false)
  })

  it('resets the settle latch when the account changes', () => {
    useQuery.mockReturnValue({
      data: [{ chainId: 1, tokens: [], dataAccurate: true, error: null }],
      isFetching: false,
      isError: false,
      isPaused: false,
      refetch: jest.fn()
    })
    const { result, rerender } = renderHook(
      (acc: typeof account) => useAccountBalances(acc),
      { initialProps: account }
    )
    expect(result.current.isLoading).toBe(false)

    // Switch accounts: react-query hands us a brand new query key with no
    // data yet, mid-first-fetch for the new account.
    useQuery.mockReturnValue({
      data: undefined,
      isFetching: true,
      isError: false,
      isPaused: false,
      refetch: jest.fn()
    })
    rerender(accountB)

    expect(result.current.isLoading).toBe(true)
  })

  it('resets the settle latch when the enabled-network set changes', () => {
    useQuery.mockReturnValue({
      data: [{ chainId: 1, tokens: [], dataAccurate: true, error: null }],
      isFetching: false,
      isError: false,
      isPaused: false,
      refetch: jest.fn()
    })
    const { result, rerender } = renderHook(() => useAccountBalances(account))
    expect(result.current.isLoading).toBe(false)

    // User enables a third network: a new query key, mid-first-fetch.
    mockEnabledNetworks = [{ chainId: 1 }, { chainId: 2 }, { chainId: 3 }]
    useQuery.mockReturnValue({
      data: undefined,
      isFetching: true,
      isError: false,
      isPaused: false,
      refetch: jest.fn()
    })
    rerender()

    expect(result.current.isLoading).toBe(true)
  })
})

describe('createBalanceBatcher', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  const balance = (chainId: number): never => ({ chainId } as never)

  it('flushes the first balance immediately (leading edge)', () => {
    const flush = jest.fn()
    const batcher = createBalanceBatcher(flush)

    batcher.add(balance(1))

    expect(flush).toHaveBeenCalledTimes(1)
    expect(flush).toHaveBeenCalledWith([balance(1)])
  })

  it('merges balances arriving within the window into one trailing flush', () => {
    const flush = jest.fn()
    const batcher = createBalanceBatcher(flush)

    batcher.add(balance(1))
    batcher.add(balance(2))
    batcher.add(balance(3))
    expect(flush).toHaveBeenCalledTimes(1)

    jest.runOnlyPendingTimers()

    expect(flush).toHaveBeenCalledTimes(2)
    expect(flush).toHaveBeenLastCalledWith([balance(2), balance(3)])
  })

  it('re-arms the leading edge after a quiet window', () => {
    const flush = jest.fn()
    const batcher = createBalanceBatcher(flush)

    batcher.add(balance(1))
    jest.runOnlyPendingTimers()

    batcher.add(balance(2))
    batcher.add(balance(3))
    jest.runAllTimers()

    expect(flush).toHaveBeenCalledTimes(3)
    expect(flush.mock.calls[1][0]).toEqual([balance(2)])
    expect(flush).toHaveBeenLastCalledWith([balance(3)])
  })

  it('dispose drops buffered balances and cancels pending flushes', () => {
    const flush = jest.fn()
    const batcher = createBalanceBatcher(flush)

    batcher.add(balance(1))
    batcher.add(balance(2))
    batcher.dispose()
    batcher.add(balance(3))
    jest.runAllTimers()

    expect(flush).toHaveBeenCalledTimes(1)
    expect(flush).toHaveBeenCalledWith([balance(1)])
  })
})

describe('useAccountBalances queryFn cache-write batching', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    mockEnabledNetworks = [{ chainId: 1 }, { chainId: 2 }, { chainId: 3 }]
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  const BalanceService = jest.requireMock(
    'services/balance/BalanceService'
  ).default

  const renderAndCaptureQueryFn = (): (() => Promise<unknown>) => {
    let captured: { queryFn: () => Promise<unknown> } | undefined
    useQuery.mockImplementation((options: never) => {
      captured = options
      return {
        data: undefined,
        isFetching: false,
        isError: false,
        isPaused: false,
        refetch: jest.fn()
      }
    })
    renderHook(() => useAccountBalances(account))
    if (!captured) throw new Error('useQuery options not captured')
    return captured.queryFn
  }

  const balances = [{ chainId: 1 }, { chainId: 2 }, { chainId: 3 }] as never[]

  it('warm refetch: no intermediate cache writes, only the atomic result', async () => {
    mockQueryClient.getQueryData.mockReturnValue([{ chainId: 1 }])
    BalanceService.getBalancesForAccount.mockImplementation(
      async ({ onBalanceLoaded }: { onBalanceLoaded?: (b: never) => void }) => {
        expect(onBalanceLoaded).toBeUndefined()
        return balances
      }
    )

    const queryFn = renderAndCaptureQueryFn()
    await expect(queryFn()).resolves.toEqual(balances)

    expect(mockQueryClient.setQueryData).not.toHaveBeenCalled()
  })

  it('cold load: per-chain arrivals are batched into few cache writes', async () => {
    mockQueryClient.getQueryData.mockReturnValue(undefined)
    BalanceService.getBalancesForAccount.mockImplementation(
      async ({ onBalanceLoaded }: { onBalanceLoaded?: (b: never) => void }) => {
        balances.forEach(b => onBalanceLoaded?.(b))
        return balances
      }
    )

    const queryFn = renderAndCaptureQueryFn()
    await expect(queryFn()).resolves.toEqual(balances)

    // 3 chains → 1 leading write; the trailing buffer is superseded by the
    // atomic queryFn result and disposed, never written.
    expect(mockQueryClient.setQueryData).toHaveBeenCalledTimes(1)
    const updater = mockQueryClient.setQueryData.mock.calls[0][1]
    expect(updater(undefined)).toEqual([{ chainId: 1 }])
    expect(updater([{ chainId: 1, stale: true }, { chainId: 9 }])).toEqual([
      { chainId: 9 },
      { chainId: 1 }
    ])
  })

  it('cold load: duplicate chainIds within one batch are deduped, last write wins', async () => {
    mockQueryClient.getQueryData.mockReturnValue(undefined)
    const first = { chainId: 1, version: 'stream' } as never
    const second = { chainId: 1, version: 'vm-retry' } as never
    BalanceService.getBalancesForAccount.mockImplementation(
      async ({ onBalanceLoaded }: { onBalanceLoaded?: (b: never) => void }) => {
        onBalanceLoaded?.(first)
        jest.runOnlyPendingTimers()
        onBalanceLoaded?.(second)
        onBalanceLoaded?.(second)
        jest.runOnlyPendingTimers()
        return [second]
      }
    )

    const queryFn = renderAndCaptureQueryFn()
    await queryFn()

    const lastUpdater = mockQueryClient.setQueryData.mock.calls.at(-1)[1]
    expect(lastUpdater([first])).toEqual([second])
  })

  it('cold load: pending buffer is flushed, not dropped, when the fetch throws', async () => {
    mockQueryClient.getQueryData.mockReturnValue(undefined)
    const streamed = { chainId: 2 } as never
    BalanceService.getBalancesForAccount.mockImplementation(
      async ({ onBalanceLoaded }: { onBalanceLoaded?: (b: never) => void }) => {
        onBalanceLoaded?.({ chainId: 1 } as never)
        onBalanceLoaded?.(streamed)
        throw new Error('balance api down')
      }
    )

    const queryFn = renderAndCaptureQueryFn()
    await expect(queryFn()).rejects.toThrow('balance api down')

    // leading flush wrote chainId 1; the error-path flush must write the
    // still-buffered chainId 2 instead of discarding it
    expect(mockQueryClient.setQueryData).toHaveBeenCalledTimes(2)
    const errorFlushUpdater = mockQueryClient.setQueryData.mock.calls.at(-1)[1]
    expect(errorFlushUpdater([{ chainId: 1 }])).toEqual([
      { chainId: 1 },
      streamed
    ])
  })
})
