import { renderHook } from '@testing-library/react-hooks'
import { usePerpsEnableTradingGate } from './usePerpsEnableTradingGate'

const mockNavigate = jest.fn()
const mockIsFocused = jest.fn(() => true)
jest.mock('expo-router', () => ({
  useRouter: () => ({ navigate: mockNavigate }),
  useNavigation: () => ({ isFocused: mockIsFocused })
}))

const mockPerps = { hasAgent: true, isLoadingAgent: false }
jest.mock('../contexts/PerpsProvider', () => ({
  usePerps: () => mockPerps
}))

const mockBuilderFee: {
  isApproved: boolean
  feeTenthsBps: number | undefined
  isLoading: boolean
} = { isApproved: true, feeTenthsBps: 10, isLoading: false }
jest.mock('./usePerpsBuilderFee', () => ({
  usePerpsBuilderFee: () => mockBuilderFee
}))

const mockUnified = { isUnifiedAccount: true, isLoading: false }
jest.mock('./usePerpsUnifiedAccount', () => ({
  usePerpsUnifiedAccount: () => mockUnified
}))

describe('usePerpsEnableTradingGate', () => {
  beforeEach(() => {
    mockPerps.hasAgent = true
    mockPerps.isLoadingAgent = false
    mockBuilderFee.isApproved = true
    mockBuilderFee.feeTenthsBps = 10
    mockBuilderFee.isLoading = false
    mockUnified.isUnifiedAccount = true
    mockUnified.isLoading = false
    mockIsFocused.mockReturnValue(true)
    mockNavigate.mockClear()
  })

  it('passes the gate without navigating when setup is complete', () => {
    const { result } = renderHook(() => usePerpsEnableTradingGate())
    expect(result.current.isTradingEnabled).toBe(true)
    expect(result.current.requireTradingEnabled()).toBe(true)
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('presents the enable-trading sheet and bails when setup is incomplete', () => {
    mockPerps.hasAgent = false
    const { result } = renderHook(() => usePerpsEnableTradingGate())
    expect(result.current.isTradingEnabled).toBe(false)
    expect(result.current.requireTradingEnabled()).toBe(false)
    expect(mockNavigate).toHaveBeenCalledWith('/perpetualsEnableTrading')
  })

  it('bails without presenting when the calling screen is no longer focused', () => {
    // Callers may await before gating (place-order's geo re-check); if the
    // user dismissed the screen during that await, the sheet must not open
    // over whatever they navigated to.
    mockPerps.hasAgent = false
    mockIsFocused.mockReturnValue(false)
    const { result } = renderHook(() => usePerpsEnableTradingGate())
    expect(result.current.requireTradingEnabled()).toBe(false)
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('treats an unresolved builder fee (undefined) as done, not as unapproved', () => {
    mockBuilderFee.feeTenthsBps = undefined
    mockBuilderFee.isApproved = false
    const { result } = renderHook(() => usePerpsEnableTradingGate())
    expect(result.current.isTradingEnabled).toBe(true)
  })

  it.each([
    ['agent', () => (mockPerps.isLoadingAgent = true)],
    ['builder fee', () => (mockBuilderFee.isLoading = true)],
    ['unified account', () => (mockUnified.isLoading = true)]
  ])('reports status loading while the %s query resolves', (_label, arm) => {
    arm()
    const { result } = renderHook(() => usePerpsEnableTradingGate())
    expect(result.current.isTradingStatusLoading).toBe(true)
  })
})
