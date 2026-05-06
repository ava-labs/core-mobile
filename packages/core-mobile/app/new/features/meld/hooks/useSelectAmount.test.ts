/**
 * Tests for the redirectUrl field added to useSelectAmount as part of CP-12099.
 *
 * useSelectAmount is a large hook that orchestrates many sub-hooks. To keep
 * these tests fast and focused we mock every dependency and only verify the
 * redirectUrl value that the hook returns.
 */

// ---------------------------------------------------------------------------
// Module mocks – must appear before any imports that pull in the mocked code
// ---------------------------------------------------------------------------

jest.mock('react-redux', () => ({
  useSelector: jest.fn()
}))

jest.mock('@avalabs/k2-alpine', () => ({
  useTheme: jest.fn(() => ({ theme: { colors: {} } })),
  alpha: jest.fn((color: string, _opacity: number) => color),
  View: 'View',
  Text: 'Text'
}))

jest.mock('common/components/SubTextNumber', () => ({
  SubTextNumber: 'SubTextNumber'
}))

jest.mock('store/settings/currency', () => ({
  selectSelectedCurrency: jest.fn()
}))

jest.mock('hooks/networks/useNetworks', () => ({
  useNetworks: jest.fn(() => ({
    getFromPopulatedNetwork: jest.fn(() => undefined)
  }))
}))

jest.mock('store/account', () => ({
  selectActiveAccount: jest.fn()
}))

jest.mock('store/account/utils', () => ({
  getAddressByNetwork: jest.fn()
}))

jest.mock('common/hooks/useFormatCurrency', () => ({
  useFormatCurrency: jest.fn(() => ({ formatCurrency: jest.fn() }))
}))

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn()
}))

jest.mock('use-debounce', () => ({
  useDebouncedCallback: jest.fn((fn: unknown) => fn)
}))

jest.mock('common/hooks/useMarketTokenBySymbol', () => ({
  useMarketTokenBySymbol: jest.fn(() => undefined)
}))

jest.mock('utils/Logger', () => ({
  __esModule: true,
  default: { error: jest.fn() }
}))

jest.mock('utils/string/humanize', () => ({
  humanize: jest.fn((s: string) => s)
}))

jest.mock('../store', () => ({
  useMeldCountryCode: jest.fn(() => ['US', jest.fn()]),
  useMeldPaymentMethod: jest.fn(() => [undefined, jest.fn()]),
  useMeldServiceProvider: jest.fn(() => [undefined, jest.fn()]),
  useMeldFiatAmount: jest.fn(() => [undefined, jest.fn()])
}))

jest.mock('./useSearchDefaultsByCountry', () => ({
  useSearchDefaultsByCountry: jest.fn(() => ({
    data: undefined,
    isLoading: false
  }))
}))

jest.mock('./useCreateSessionWidget', () => ({
  useCreateSessionWidget: jest.fn(() => ({
    createSessionWidget: jest.fn()
  }))
}))

jest.mock('./useServiceProviders', () => ({
  useServiceProviders: jest.fn(() => ({
    crytoQuotes: [],
    isLoadingCryptoQuotes: false,
    cryptoQuotesError: undefined
  }))
}))

jest.mock('./useFiatSourceAmount', () => ({
  useFiatSourceAmount: jest.fn(() => ({
    sourceAmount: undefined,
    setSourceAmount: jest.fn(),
    isAboveMinimumLimit: true,
    isBelowMaximumLimit: true,
    hasValidSourceAmount: false,
    minimumLimit: undefined,
    maximumLimit: undefined,
    isLoadingTradeLimits: false
  }))
}))

jest.mock('./useMeldTokenWithBalance', () => ({
  useMeldTokenWithBalance: jest.fn(() => undefined)
}))

// ---------------------------------------------------------------------------
// Real imports (after mock declarations)
// ---------------------------------------------------------------------------

import { renderHook } from '@testing-library/react-hooks'
import { useNavigation } from '@react-navigation/native'
import { ServiceProviderCategories } from '../consts'
import { useSelectAmount } from './useSelectAmount'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockUseNavigation = useNavigation as jest.Mock

/**
 * Build a minimal navigation state with the given stack index.
 */
function makeNavState(index: number) {
  return { index }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useSelectAmount – redirectUrl', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns a redirectUrl containing "onrampCompleted" for CRYPTO_ONRAMP', () => {
    mockUseNavigation.mockReturnValue({
      getState: () => makeNavState(0)
    })

    const { result } = renderHook(() =>
      useSelectAmount({ category: ServiceProviderCategories.CRYPTO_ONRAMP })
    )

    expect(result.current.redirectUrl).toContain('onrampCompleted')
  })

  it('returns a redirectUrl containing "offrampCompleted" for CRYPTO_OFFRAMP', () => {
    mockUseNavigation.mockReturnValue({
      getState: () => makeNavState(0)
    })

    const { result } = renderHook(() =>
      useSelectAmount({ category: ServiceProviderCategories.CRYPTO_OFFRAMP })
    )

    expect(result.current.redirectUrl).toContain('offrampCompleted')
  })

  it('includes dismissCount equal to (navigationIndex + 1) in the redirectUrl', () => {
    const navIndex = 3
    mockUseNavigation.mockReturnValue({
      getState: () => makeNavState(navIndex)
    })

    const { result } = renderHook(() =>
      useSelectAmount({ category: ServiceProviderCategories.CRYPTO_ONRAMP })
    )

    expect(result.current.redirectUrl).toContain(`dismissCount=${navIndex + 1}`)
  })

  it('uses dismissCount=1 when navigation state index is 0', () => {
    mockUseNavigation.mockReturnValue({
      getState: () => makeNavState(0)
    })

    const { result } = renderHook(() =>
      useSelectAmount({ category: ServiceProviderCategories.CRYPTO_ONRAMP })
    )

    expect(result.current.redirectUrl).toContain('dismissCount=1')
  })

  it('uses dismissCount=1 when navigation state is undefined', () => {
    mockUseNavigation.mockReturnValue({
      getState: () => undefined
    })

    const { result } = renderHook(() =>
      useSelectAmount({ category: ServiceProviderCategories.CRYPTO_ONRAMP })
    )

    // (undefined ?? 0) + 1 = 1
    expect(result.current.redirectUrl).toContain('dismissCount=1')
  })

  it('uses the core:// custom URL scheme', () => {
    mockUseNavigation.mockReturnValue({
      getState: () => makeNavState(0)
    })

    const { result } = renderHook(() =>
      useSelectAmount({ category: ServiceProviderCategories.CRYPTO_ONRAMP })
    )

    expect(result.current.redirectUrl).toMatch(/^core:\/\//)
  })
})
