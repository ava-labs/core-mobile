import { renderHook, act } from '@testing-library/react-hooks'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useCancelRecurringSchedule } from './useCancelRecurringSchedule'

const mockCancel = jest.fn()
const mockSnackbar = jest.fn()

jest.mock('../services/RecurringSchedulesService.singleton', () => ({
  getRecurringSchedulesService: () => ({ cancel: mockCancel })
}))

jest.mock('common/utils/toast', () => ({
  showSnackbar: (...args: unknown[]) => mockSnackbar(...args)
}))

const wrap = ({ children }: { children: React.ReactNode }) =>
  React.createElement(
    QueryClientProvider,
    {
      client: new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false }
        }
      })
    },
    children
  )

describe('useCancelRecurringSchedule', () => {
  beforeEach(() => {
    mockCancel.mockReset()
    mockSnackbar.mockReset()
  })

  it('calls cancel with orderId + address', async () => {
    mockCancel.mockResolvedValueOnce({ orderId: '0xdead', status: 'cancelled' })
    const { result, waitFor } = renderHook(
      () => useCancelRecurringSchedule(),
      { wrapper: wrap }
    )
    await act(async () => {
      result.current.mutate({ orderId: '0xdead', address: '0xabc' })
    })
    await waitFor(() => expect(mockCancel).toHaveBeenCalledTimes(1))
    expect(mockCancel).toHaveBeenCalledWith({
      orderId: '0xdead',
      address: '0xabc'
    })
  })

  it('surfaces typed not_cancellable error', async () => {
    mockCancel.mockRejectedValueOnce({
      kind: 'not_cancellable',
      message: 'already done'
    })
    const { result, waitFor } = renderHook(
      () => useCancelRecurringSchedule(),
      { wrapper: wrap }
    )
    await act(async () => {
      result.current.mutate({ orderId: '0xdead', address: '0xabc' })
    })
    await waitFor(() => expect(mockSnackbar).toHaveBeenCalled())
    expect(mockSnackbar).toHaveBeenCalledWith(
      'This schedule has already finished'
    )
  })

  it('surfaces typed not_found error', async () => {
    mockCancel.mockRejectedValueOnce({
      kind: 'not_found',
      message: 'not yours'
    })
    const { result, waitFor } = renderHook(
      () => useCancelRecurringSchedule(),
      { wrapper: wrap }
    )
    await act(async () => {
      result.current.mutate({ orderId: '0xdead', address: '0xabc' })
    })
    await waitFor(() =>
      expect(mockSnackbar).toHaveBeenCalledWith('Unable to remove')
    )
  })
})
