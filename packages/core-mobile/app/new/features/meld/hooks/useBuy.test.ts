import { renderHook } from '@testing-library/react-hooks'
import { CryptoCurrency } from '../types'
import { useBuy } from './useBuy'

const mockNavigate = jest.fn()
const mockSetOnrampToken = jest.fn()
const mockGetTradableCryptoCurrency = jest.fn()
let mockIsBlocked = false

jest.mock('expo-router', () => ({
  useRouter: () => ({ navigate: mockNavigate })
}))

jest.mock('react-redux', () => ({
  useSelector: () => mockIsBlocked
}))

jest.mock('store/posthog', () => ({
  selectIsMeldOnrampBlocked: jest.fn()
}))

jest.mock('../store', () => ({
  useMeldToken: () => [undefined, mockSetOnrampToken]
}))

jest.mock('./useSearchCryptoCurrencies', () => ({
  useSearchCryptoCurrencies: () => ({ data: [], isLoading: false })
}))

jest.mock('./useGetTradableCryptoCurrency', () => ({
  useGetTradableCryptoCurrency: () => ({
    getTradableCryptoCurrency: mockGetTradableCryptoCurrency
  })
}))

const avax = { currencyCode: 'AVAXC' } as CryptoCurrency

describe('useBuy navigateToBuy', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    mockIsBlocked = false
  })

  it('opens the amount screen with the token when it resolves', () => {
    mockGetTradableCryptoCurrency.mockReturnValue(avax)
    const { result } = renderHook(() => useBuy())
    result.current.navigateToBuy({ address: '0xabc' })
    expect(mockSetOnrampToken).toHaveBeenCalledWith(avax)
    expect(mockNavigate).toHaveBeenCalledWith('/meld/onramp/selectBuyAmount')
  })

  it('opens the token picker when the address does not resolve', () => {
    mockGetTradableCryptoCurrency.mockReturnValue(undefined)
    const { result } = renderHook(() => useBuy())
    result.current.navigateToBuy({ address: '0xabc' })
    expect(mockSetOnrampToken).toHaveBeenCalledWith(undefined)
    expect(mockNavigate).toHaveBeenCalledWith('/meld/onramp')
  })

  it('goes to /buy when onramp is blocked', () => {
    mockIsBlocked = true
    const { result } = renderHook(() => useBuy())
    result.current.navigateToBuy({ address: '0xabc', showAvaxWarning: true })
    expect(mockSetOnrampToken).not.toHaveBeenCalled()
    expect(mockNavigate).toHaveBeenCalledWith({
      pathname: '/buy',
      params: { showAvaxWarning: 'true' }
    })
  })

  it('opens the token picker with no args', () => {
    const { result } = renderHook(() => useBuy())
    result.current.navigateToBuy()
    expect(mockSetOnrampToken).toHaveBeenCalledWith(undefined)
    expect(mockNavigate).toHaveBeenCalledWith('/meld/onramp')
  })
})
