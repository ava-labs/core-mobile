import React from 'react'
import renderer, { act } from 'react-test-renderer'

const mockRefreshAfterTrade = jest.fn()
jest.mock('../contexts/PerpsProvider', () => ({
  usePerps: () => ({ refreshAfterTrade: mockRefreshAfterTrade })
}))

const mockInvalidateQueries = jest.fn()
jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries })
}))

import { usePerpsPullToRefresh } from './usePerpsPullToRefresh'

type HookResult = ReturnType<typeof usePerpsPullToRefresh>

const renderHook = async (
  extraRefresh?: () => Promise<unknown>
): Promise<{ current: () => HookResult }> => {
  const result: { value?: HookResult } = {}
  const Probe = (): null => {
    result.value = usePerpsPullToRefresh(extraRefresh)
    return null
  }
  await act(async () => {
    renderer.create(<Probe />)
  })
  return {
    current: () => {
      if (result.value === undefined) throw new Error('hook not rendered')
      return result.value
    }
  }
}

describe('usePerpsPullToRefresh', () => {
  beforeEach(() => {
    mockRefreshAfterTrade.mockReset()
    mockInvalidateQueries.mockReset()
    mockInvalidateQueries.mockResolvedValue(undefined)
  })

  it('bumps the perps refresh and spins until the clearinghouse refetch settles', async () => {
    const hook = await renderHook()
    expect(hook.current().isRefreshing).toBe(false)

    await act(async () => {
      hook.current().onRefresh()
    })

    expect(mockRefreshAfterTrade).toHaveBeenCalledTimes(1)
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ['perpsClearinghouse']
    })
    expect(hook.current().isRefreshing).toBe(false)
  })

  it('shows the spinner while refreshes are in flight', async () => {
    let resolveInvalidate!: () => void
    mockInvalidateQueries.mockReturnValueOnce(
      new Promise<void>(resolve => {
        resolveInvalidate = resolve
      })
    )
    const hook = await renderHook()

    act(() => {
      hook.current().onRefresh()
    })
    expect(hook.current().isRefreshing).toBe(true)

    await act(async () => {
      resolveInvalidate()
    })
    expect(hook.current().isRefreshing).toBe(false)
  })

  it('awaits the extra refresh and still settles when it rejects', async () => {
    const extraRefresh = jest.fn().mockRejectedValue(new Error('offline'))
    const hook = await renderHook(extraRefresh)

    await act(async () => {
      hook.current().onRefresh()
    })

    expect(extraRefresh).toHaveBeenCalledTimes(1)
    expect(hook.current().isRefreshing).toBe(false)
  })
})
