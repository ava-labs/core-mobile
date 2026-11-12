import React, { ReactNode } from 'react'
import { renderHook } from '@testing-library/react-hooks'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ServiceProviderCategories } from '../consts'
import { npRoutesUsdAvaxc } from '../services/__fixtures__/networkPartner'
import { useSearchPaymentMethods } from './useSearchPaymentMethods'

const mockSearchRoutes = jest.fn()
const mockSearchPaymentMethods = jest.fn()

const mockState = {
  token: undefined as { currencyCode: string } | undefined,
  countryCode: 'US' as string | undefined
}

jest.mock('features/meld/services/MeldService', () => ({
  __esModule: true,
  default: {
    searchRoutes: (...args: unknown[]) => mockSearchRoutes(...args),
    searchPaymentMethods: (...args: unknown[]) =>
      mockSearchPaymentMethods(...args)
  }
}))

jest.mock('../store', () => ({
  useMeldToken: () => [mockState.token, jest.fn()],
  useMeldCountryCode: () => [mockState.countryCode, jest.fn()]
}))

jest.mock('react-redux', () => ({
  useSelector: () => 'USD'
}))

jest.mock('utils/Utils', () => ({
  isAndroid: true,
  isIOS: false
}))

const category = ServiceProviderCategories.CRYPTO_ONRAMP

let queryClient: QueryClient

const wrapper = ({ children }: { children: ReactNode }): ReactNode =>
  React.createElement(QueryClientProvider, { client: queryClient }, children)

describe('useSearchPaymentMethods', () => {
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } }
    })
    jest.resetAllMocks()
    mockState.token = undefined
    mockState.countryCode = 'US'
  })

  afterEach(() => {
    queryClient.clear()
  })

  it('uses the routes query and filters Apple Pay on Android when a token is selected', async () => {
    mockState.token = { currencyCode: 'AVAXC' }
    mockSearchRoutes.mockResolvedValue(npRoutesUsdAvaxc)
    const { result, waitFor } = renderHook(
      () => useSearchPaymentMethods({ category }),
      { wrapper }
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockSearchRoutes).toHaveBeenCalledTimes(1)
    expect(mockSearchRoutes).toHaveBeenCalledWith({
      categories: [category],
      countries: ['US'],
      fiatCurrencies: ['USD'],
      cryptoCurrencyCodes: ['AVAXC']
    })
    expect(mockSearchPaymentMethods).not.toHaveBeenCalled()
    expect(result.current.data?.map(m => m.paymentMethod)).toEqual([
      'CREDIT_DEBIT_CARD',
      'ACH'
    ])
  })

  it('falls back to the payment-methods endpoint when no token is selected', async () => {
    mockSearchPaymentMethods.mockResolvedValue([
      { paymentMethod: 'ACH', logos: {} }
    ])
    const { result, waitFor } = renderHook(
      () => useSearchPaymentMethods({ category }),
      { wrapper }
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockSearchRoutes).not.toHaveBeenCalled()
    expect(mockSearchPaymentMethods).toHaveBeenCalledTimes(1)
    expect(mockSearchPaymentMethods).toHaveBeenCalledWith({
      categories: [category],
      countries: ['US'],
      fiatCurrencies: ['USD']
    })
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data?.[0]?.paymentMethod).toBe('ACH')
  })
})
