import { renderHook } from '@testing-library/react-hooks'
import { useFeatureAvailability } from 'common/hooks/useFeatureAvailability'
import { usePerpsAvailability } from './usePerpsAvailability'

jest.mock('common/hooks/useFeatureAvailability')
const mockUseFeatureAvailability = useFeatureAvailability as jest.Mock

const mockFetchQuery = jest.fn()
jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ fetchQuery: mockFetchQuery })
}))

const available = {
  isAvailable: true,
  isLoading: false,
  isError: false
}

describe('usePerpsAvailability', () => {
  it('checks the "perps" feature', () => {
    mockUseFeatureAvailability.mockReturnValue({
      isAvailable: true,
      isLoading: false,
      isError: false
    })
    renderHook(() => usePerpsAvailability())
    expect(mockUseFeatureAvailability).toHaveBeenCalledWith('perps')
  })

  it('is not geo-blocked when perps is available', () => {
    mockUseFeatureAvailability.mockReturnValue({
      isAvailable: true,
      isLoading: false,
      isError: false
    })
    const { result } = renderHook(() => usePerpsAvailability())
    expect(result.current.isGeoBlocked).toBe(false)
  })

  it('is geo-blocked when perps is unavailable', () => {
    mockUseFeatureAvailability.mockReturnValue({
      isAvailable: false,
      isLoading: false,
      isError: false
    })
    const { result } = renderHook(() => usePerpsAvailability())
    expect(result.current.isGeoBlocked).toBe(true)
  })

  it('forwards the loading state', () => {
    mockUseFeatureAvailability.mockReturnValue({
      isAvailable: true,
      isLoading: true,
      isError: false
    })
    const { result } = renderHook(() => usePerpsAvailability())
    expect(result.current.isLoading).toBe(true)
  })

  describe('recheckGeoBlock', () => {
    beforeEach(() => mockFetchQuery.mockReset())

    it('returns true (blocked) when the fresh check says unavailable', async () => {
      mockUseFeatureAvailability.mockReturnValue(available)
      mockFetchQuery.mockResolvedValueOnce(false)
      const { result } = renderHook(() => usePerpsAvailability())
      await expect(result.current.recheckGeoBlock()).resolves.toBe(true)
    })

    it('returns false (allowed) when the fresh check says available', async () => {
      mockUseFeatureAvailability.mockReturnValue(available)
      mockFetchQuery.mockResolvedValueOnce(true)
      const { result } = renderHook(() => usePerpsAvailability())
      await expect(result.current.recheckGeoBlock()).resolves.toBe(false)
    })

    it('bypasses the cache by forcing a fresh fetch (staleTime 0)', async () => {
      mockUseFeatureAvailability.mockReturnValue(available)
      mockFetchQuery.mockResolvedValueOnce(true)
      const { result } = renderHook(() => usePerpsAvailability())
      await result.current.recheckGeoBlock()
      expect(mockFetchQuery).toHaveBeenCalledWith(
        expect.objectContaining({ staleTime: 0 })
      )
    })
  })
})
