import { renderHook } from '@testing-library/react-hooks'
import type { StuckRoute } from '../utils/stuckFundsRoutes'
import { useStuckAtomicFunds } from './useStuckAtomicFunds'

const mockInvalidateQueries = jest.fn()

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn()
}))

jest.mock('contexts/ReactQueryProvider', () => ({
  queryClient: {
    invalidateQueries: (...args: unknown[]) => mockInvalidateQueries(...args)
  }
}))

jest.mock('react-redux', () => ({
  useSelector: (fn: () => unknown) => fn()
}))

jest.mock('store/account', () => ({
  selectActiveAccount: () => ({ id: 'acc-1' })
}))
jest.mock('store/posthog', () => ({
  selectIsFusionAvalancheCctEnabled: () => true
}))
jest.mock('store/settings/advanced', () => ({
  selectIsDeveloperMode: () => false
}))
jest.mock('hooks/useXPAddresses/useXPAddresses', () => ({
  useXPAddresses: () => ({ xpAddresses: ['P-fuji1abc'] })
}))
jest.mock('services/wallet/AvalancheWalletService', () => ({
  __esModule: true,
  default: { getAllAtomicUTXOs: jest.fn() }
}))
jest.mock('services/wallet/utils', () => ({
  getAvaxAssetId: () => 'avax-asset-id'
}))

const { useQuery } = jest.requireMock('@tanstack/react-query')

describe('useStuckAtomicFunds', () => {
  beforeEach(() => {
    mockInvalidateQueries.mockReset()
  })

  it('aggregates total and hasAnyAtomics from the query data', () => {
    const routes: StuckRoute[] = [
      { source: 'C', dest: 'P', amountNAvax: 100_000_000n },
      { source: 'X', dest: 'C', amountNAvax: 50_000_000n }
    ]
    useQuery.mockReturnValue({ data: routes })

    const { result } = renderHook(() => useStuckAtomicFunds())

    expect(result.current.routes).toBe(routes)
    expect(result.current.totalNAvax).toBe(150_000_000n)
    expect(result.current.hasAnyAtomics).toBe(true)
  })

  it('reports no atomics when query data is empty', () => {
    useQuery.mockReturnValue({ data: [] })

    const { result } = renderHook(() => useStuckAtomicFunds())

    expect(result.current.totalNAvax).toBe(0n)
    expect(result.current.hasAnyAtomics).toBe(false)
  })

  it('invalidate clears the stuck-atomic-funds query', () => {
    useQuery.mockReturnValue({ data: [] })

    const { result } = renderHook(() => useStuckAtomicFunds())
    result.current.invalidate()

    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ['fusionStuckAtomicFunds']
    })
  })
})
