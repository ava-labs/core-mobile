import { renderHook } from '@testing-library/react-hooks'
import { useAccountBalances } from './useAccountBalances'

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
  useQueryClient: () => ({ setQueryData: jest.fn() })
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
