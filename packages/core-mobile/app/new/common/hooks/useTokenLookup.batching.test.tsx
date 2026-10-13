import React from 'react'
import { renderHook } from '@testing-library/react-hooks'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useTokenLookup } from './useTokenLookup'

// Deliberately does NOT mock @tanstack/react-query, unlike the sibling
// useTokenLookup.test.ts. The point of this file is to drive the real
// useQueries -> queryFn -> coalescer -> chunking -> client path, which is the
// only way to prove N tokens produce one request.
jest.mock('utils/api/generated/tokenAggregator/aggregatorApi.client', () => ({
  postV1TokenLookup: jest.fn()
}))

jest.mock('utils/api/clients/aggregatedTokensApiClient', () => ({
  tokenAggregatorApi: {}
}))

const { postV1TokenLookup } = jest.requireMock(
  'utils/api/generated/tokenAggregator/aggregatorApi.client'
) as { postV1TokenLookup: jest.Mock }

const CAIP2 = 'eip155:43114'

// Mixed-case addresses paired with lowercased response keys: the server
// lowercases EVM keys, so this also proves the casing round-trip end to end.
const addressAt = (index: number): string =>
  `0xAbCdEf${index.toString().padStart(34, '0')}`

const tokenAt = (index: number): { caip2Id: string; address: string } => ({
  caip2Id: CAIP2,
  address: addressAt(index)
})

const tokens = (count: number): Array<{ caip2Id: string; address: string }> =>
  Array.from({ length: count }, (_, index) => tokenAt(index))

const responseKey = (address: string): string =>
  `${CAIP2}-${address}`.toLowerCase()

const symbolFor = (address: string): string => `SYM${address.slice(-4)}`

const echoRequestedTokens = (): void => {
  postV1TokenLookup.mockImplementation(
    (options: { body: { tokens: Array<{ address: string }> } }) =>
      Promise.resolve({
        data: {
          data: Object.fromEntries(
            options.body.tokens.map(({ address }) => [
              responseKey(address),
              { symbol: symbolFor(address), name: symbolFor(address) }
            ])
          )
        }
      })
  )
}

const requestedAddresses = (callIndex: number): string[] =>
  postV1TokenLookup.mock.calls[callIndex][0].body.tokens.map(
    (token: { address: string }) => token.address
  )

const newWrapper = (
  client: QueryClient
): React.FC<{ children: React.ReactNode }> => {
  // prettier-ignore
  return ({ children }: { children: React.ReactNode }): JSX.Element => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
}

const clients: QueryClient[] = []

const newClient = (): QueryClient => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  })
  clients.push(client)
  return client
}

describe('useTokenLookup batching', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    echoRequestedTokens()
  })

  // Release each client's cache rather than leaving it to gcTime. Note this
  // does not silence Jest's "did not exit" warning -- that comes from the
  // renderHook + real QueryClient pattern generally and predates this file
  // (useFeatureAvailability.test.tsx needs --forceExit too).
  afterEach(() => {
    clients.forEach(client => {
      client.clear()
      client.unmount()
    })
    clients.length = 0
  })

  it('resolves eight tokens with a single request', async () => {
    const requested = tokens(8)

    const { result, waitFor } = renderHook(() => useTokenLookup(requested), {
      wrapper: newWrapper(newClient())
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(postV1TokenLookup).toHaveBeenCalledTimes(1)
    expect(requestedAddresses(0)).toEqual(requested.map(t => t.address))
    expect(Object.keys(result.current.data)).toHaveLength(8)
  })

  it('exposes every token under its lowercased response key', async () => {
    const requested = tokens(3)

    const { result, waitFor } = renderHook(() => useTokenLookup(requested), {
      wrapper: newWrapper(newClient())
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    requested.forEach(({ address }) => {
      expect(result.current.data[responseKey(address)]).toEqual({
        symbol: symbolFor(address),
        name: symbolFor(address)
      })
    })
  })

  it('serves an already-cached token without a further request', async () => {
    const client = newClient()
    const wrapper = newWrapper(client)

    const first = renderHook(() => useTokenLookup(tokens(3)), { wrapper })
    await first.waitFor(() =>
      expect(first.result.current.isLoading).toBe(false)
    )
    expect(postV1TokenLookup).toHaveBeenCalledTimes(1)

    const second = renderHook(() => useTokenLookup([tokenAt(1)]), { wrapper })
    await second.waitFor(() =>
      expect(second.result.current.isLoading).toBe(false)
    )

    expect(postV1TokenLookup).toHaveBeenCalledTimes(1)
    expect(second.result.current.data[responseKey(addressAt(1))]).toEqual({
      symbol: symbolFor(addressAt(1)),
      name: symbolFor(addressAt(1))
    })
  })

  it('requests only the tokens an overlapping set has not already cached', async () => {
    const client = newClient()
    const wrapper = newWrapper(client)

    const first = renderHook(() => useTokenLookup([tokenAt(0), tokenAt(1)]), {
      wrapper
    })
    await first.waitFor(() =>
      expect(first.result.current.isLoading).toBe(false)
    )

    const second = renderHook(() => useTokenLookup([tokenAt(1), tokenAt(2)]), {
      wrapper
    })
    await second.waitFor(() =>
      expect(second.result.current.isLoading).toBe(false)
    )

    expect(postV1TokenLookup).toHaveBeenCalledTimes(2)
    expect(requestedAddresses(0)).toEqual([addressAt(0), addressAt(1)])
    // Only the token the cache was missing.
    expect(requestedAddresses(1)).toEqual([addressAt(2)])
  })

  it('makes no request for an empty token list', async () => {
    const { result } = renderHook(() => useTokenLookup([]), {
      wrapper: newWrapper(newClient())
    })

    expect(postV1TokenLookup).not.toHaveBeenCalled()
    expect(result.current.data).toEqual({})
  })
})
