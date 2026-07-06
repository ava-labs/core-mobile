import { renderHook } from '@testing-library/react-hooks'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import {
  fetchFeatureAvailability,
  useFeatureAvailability
} from './useFeatureAvailability'

// Use the manual mock in __mocks__/react-native-config.js (PROXY_URL =
// 'MOCK_PROXY_URL') explicitly instead of relying on automatic resolution.
jest.mock('react-native-config')

const fetchMock = jest.fn()

beforeEach(() => {
  fetchMock.mockReset()
  global.fetch = fetchMock as unknown as typeof fetch
})

const newWrapper = (): React.FC<{ children: React.ReactNode }> => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  })
  // prettier-ignore
  return ({ children }: { children: React.ReactNode }): JSX.Element => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
}

describe('useFeatureAvailability', () => {
  it('requests {PROXY_URL}/{feature}/available and reports available on HTTP 200', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200 })

    const { result, waitFor } = renderHook(
      () => useFeatureAvailability('perps'),
      { wrapper: newWrapper() }
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(fetchMock).toHaveBeenCalledWith(
      'MOCK_PROXY_URL/perps/available',
      expect.anything()
    )
    expect(result.current.isAvailable).toBe(true)
  })

  it('reports unavailable on a non-200 response (fail-closed)', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 403 })

    const { result, waitFor } = renderHook(
      () => useFeatureAvailability('perps'),
      { wrapper: newWrapper() }
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.isAvailable).toBe(false)
  })

  it('reports unavailable when the request throws, without entering an error state', async () => {
    fetchMock.mockRejectedValueOnce(new Error('network/CORS'))

    const { result, waitFor } = renderHook(
      () => useFeatureAvailability('perps'),
      { wrapper: newWrapper() }
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.isAvailable).toBe(false)
    expect(result.current.isError).toBe(false)
  })

  it('assumes available while the check is still pending (no flash)', () => {
    // Fake timers so the never-settling fetch's timeout timer doesn't leak.
    jest.useFakeTimers()
    try {
      fetchMock.mockReturnValueOnce(new Promise(() => undefined))

      const { result } = renderHook(() => useFeatureAvailability('perps'), {
        wrapper: newWrapper()
      })

      expect(result.current.isLoading).toBe(true)
      expect(result.current.isAvailable).toBe(true)
    } finally {
      jest.useRealTimers()
    }
  })
})

describe('fetchFeatureAvailability', () => {
  it('requests {PROXY_URL}/{feature}/available and returns true on HTTP 200', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200 })

    await expect(fetchFeatureAvailability('perps')).resolves.toBe(true)
    expect(fetchMock).toHaveBeenCalledWith(
      'MOCK_PROXY_URL/perps/available',
      expect.objectContaining({ signal: expect.anything() })
    )
  })

  it('returns false on a non-200 response', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 403 })
    await expect(fetchFeatureAvailability('perps')).resolves.toBe(false)
  })

  it('returns false (never throws) when the request rejects', async () => {
    fetchMock.mockRejectedValueOnce(new Error('network/CORS'))
    await expect(fetchFeatureAvailability('perps')).resolves.toBe(false)
  })

  it('rethrows on cancellation so an aborted request is not cached as unavailable', async () => {
    const controller = new AbortController()
    controller.abort()
    fetchMock.mockRejectedValueOnce(new Error('Aborted'))
    await expect(
      fetchFeatureAvailability('perps', controller.signal)
    ).rejects.toThrow()
  })

  it('returns false (fail closed) when the request hangs past the timeout', async () => {
    jest.useFakeTimers()
    try {
      // A fetch that never settles until its signal aborts, like a hanging proxy.
      fetchMock.mockImplementationOnce(
        (_url: string, opts: { signal: AbortSignal }) =>
          new Promise((_resolve, reject) => {
            opts.signal.addEventListener('abort', () =>
              reject(new Error('Aborted'))
            )
          })
      )
      const promise = fetchFeatureAvailability('perps')
      jest.advanceTimersByTime(10_000)
      await expect(promise).resolves.toBe(false)
    } finally {
      jest.useRealTimers()
    }
  })
})
