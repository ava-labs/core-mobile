import React, { ReactNode } from 'react'
import { renderHook } from '@testing-library/react-hooks'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CurrencySymbol } from 'store/settings/currency'
import { ServiceProviderCategories } from '../consts'
import { npRoutesUsdBtc } from '../services/__fixtures__/networkPartner'
import { useGetTradeLimits } from './useGetTradeLimits'

const mockSearchRoutes = jest.fn()

const mockState = {
  countryCode: 'US' as string | undefined,
  paymentMethod: undefined as string | undefined
}

jest.mock('features/meld/services/MeldService', () => ({
  __esModule: true,
  default: { searchRoutes: (...args: unknown[]) => mockSearchRoutes(...args) }
}))

jest.mock('../store', () => ({
  useMeldCountryCode: () => [mockState.countryCode, jest.fn()],
  useMeldPaymentMethod: () => [mockState.paymentMethod, jest.fn()]
}))

let queryClient: QueryClient

const wrapper = ({ children }: { children: ReactNode }): ReactNode =>
  React.createElement(QueryClientProvider, { client: queryClient }, children)

const onramp = {
  category: ServiceProviderCategories.CRYPTO_ONRAMP,
  fiatCurrencies: [CurrencySymbol.USD],
  cryptoCurrencyCodes: ['BTC']
}

describe('useGetTradeLimits', () => {
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } }
    })
    jest.resetAllMocks()
    mockState.countryCode = 'US'
    mockState.paymentMethod = undefined
    mockSearchRoutes.mockResolvedValue(npRoutesUsdBtc)
  })

  afterEach(() => {
    queryClient.clear()
  })

  it('returns the envelope across all partners for the BTC routes', async () => {
    const { result, waitFor } = renderHook(() => useGetTradeLimits(onramp), {
      wrapper
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data?.[0]).toMatchObject({
      currencyCode: 'USD',
      minimumAmount: 7.78,
      maximumAmount: 111185.7
    })
  })

  it('narrows to the chosen payment method and does not refetch when it changes', async () => {
    const { result, waitFor, rerender } = renderHook(
      () => useGetTradeLimits(onramp),
      { wrapper }
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.[0]?.minimumAmount).toBe(7.78)

    mockState.paymentMethod = 'ACH'
    rerender()

    await waitFor(() =>
      expect(result.current.data?.[0]).toMatchObject({
        minimumAmount: 10.83,
        maximumAmount: 16133
      })
    )
    expect(
      Object.keys(result.current.data?.[0]?.serviceProviderDetails ?? {})
    ).toEqual(['STRIPE'])
    expect(mockSearchRoutes).toHaveBeenCalledTimes(1)
  })
})
