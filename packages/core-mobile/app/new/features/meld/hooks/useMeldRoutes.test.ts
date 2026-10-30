import React, { ReactNode } from 'react'
import { renderHook, act } from '@testing-library/react-hooks'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ServiceProviderCategories } from '../consts'
import { npRoutesUsdBtc } from '../services/__fixtures__/networkPartner'
import { useMeldRoutes } from './useMeldRoutes'

const mockSearchRoutes = jest.fn()

jest.mock('features/meld/services/MeldService', () => ({
  __esModule: true,
  default: { searchRoutes: (...args: unknown[]) => mockSearchRoutes(...args) }
}))

let queryClient: QueryClient

const wrapper = ({ children }: { children: ReactNode }): ReactNode =>
  React.createElement(QueryClientProvider, { client: queryClient }, children)

const category = ServiceProviderCategories.CRYPTO_ONRAMP

describe('useMeldRoutes', () => {
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } }
    })
    jest.resetAllMocks()
    mockSearchRoutes.mockResolvedValue(npRoutesUsdBtc)
  })

  afterEach(() => {
    queryClient.clear()
  })

  it.each([
    ['country', { fiatCurrencyCode: 'USD', cryptoCurrencyCode: 'BTC' }],
    ['fiat', { countryCode: 'US', cryptoCurrencyCode: 'BTC' }],
    ['crypto', { countryCode: 'US', fiatCurrencyCode: 'USD' }]
  ])('does not call the service without a %s', async (_, params) => {
    const { result } = renderHook(
      () => useMeldRoutes({ category, ...params }),
      {
        wrapper
      }
    )
    await act(async () => {
      await Promise.resolve()
    })
    expect(result.current.fetchStatus).toBe('idle')
    expect(mockSearchRoutes).not.toHaveBeenCalled()
  })

  it('does not call the service without a category', async () => {
    const { result } = renderHook(
      () =>
        useMeldRoutes({
          countryCode: 'US',
          fiatCurrencyCode: 'USD',
          cryptoCurrencyCode: 'BTC'
        }),
      { wrapper }
    )
    await act(async () => {
      await Promise.resolve()
    })
    expect(result.current.fetchStatus).toBe('idle')
    expect(mockSearchRoutes).not.toHaveBeenCalled()
  })

  it('fetches routes once country, fiat and crypto are present', async () => {
    const { result, waitFor } = renderHook(
      () =>
        useMeldRoutes({
          category,
          countryCode: 'US',
          fiatCurrencyCode: 'USD',
          cryptoCurrencyCode: 'BTC'
        }),
      { wrapper }
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockSearchRoutes).toHaveBeenCalledTimes(1)
    expect(mockSearchRoutes).toHaveBeenCalledWith({
      categories: [category],
      countries: ['US'],
      fiatCurrencies: ['USD'],
      cryptoCurrencyCodes: ['BTC']
    })
    expect(result.current.data).toBe(npRoutesUsdBtc)
  })
})
