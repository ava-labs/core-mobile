import React, { ReactNode } from 'react'
import { renderHook } from '@testing-library/react-hooks'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ServiceProviderCategories } from '../consts'
import { useMeldCountryCode } from '../store'
import { useSearchCryptoCurrencies } from './useSearchCryptoCurrencies'

const mockSearchCryptoCurrencies = jest.fn()

jest.mock('features/meld/services/MeldService', () => ({
  __esModule: true,
  default: {
    searchCryptoCurrencies: (...args: unknown[]) =>
      mockSearchCryptoCurrencies(...args)
  }
}))

jest.mock('expo-localization', () => ({
  getLocales: () => [{ regionCode: 'US' }],
  useLocales: () => [{ regionCode: 'US' }]
}))

let queryClient: QueryClient

const wrapper = ({ children }: { children: ReactNode }): ReactNode =>
  React.createElement(QueryClientProvider, { client: queryClient }, children)

describe('useSearchCryptoCurrencies', () => {
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } }
    })
    jest.resetAllMocks()
    mockSearchCryptoCurrencies.mockResolvedValue([])
    useMeldCountryCode.setState('US')
  })

  afterEach(() => {
    queryClient.clear()
  })

  it('sends the selected country so Meld filters the list', async () => {
    const { result, waitFor } = renderHook(
      () =>
        useSearchCryptoCurrencies({
          categories: [ServiceProviderCategories.CRYPTO_ONRAMP]
        }),
      { wrapper }
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockSearchCryptoCurrencies).toHaveBeenCalledTimes(1)
    expect(mockSearchCryptoCurrencies.mock.calls[0]?.[0]).toMatchObject({
      countries: ['US']
    })
  })
})
