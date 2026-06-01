import React from 'react'
import { renderHook, act } from '@testing-library/react-hooks'
import {
  RecurringSwapContextProvider,
  useRecurringSwapContext
} from './RecurringSwapContext'

describe('RecurringSwapContext', () => {
  const wrap = ({ children }: { children: React.ReactNode }) => (
    <RecurringSwapContextProvider>{children}</RecurringSwapContextProvider>
  )

  it('defaults to isRecurring=false, frequency unset, orders unset', () => {
    const { result } = renderHook(() => useRecurringSwapContext(), {
      wrapper: wrap
    })
    expect(result.current.isRecurring).toBe(false)
    expect(result.current.frequency).toBeUndefined()
    expect(result.current.numberOfOrders).toBeUndefined()
  })

  it('setIsRecurring(true) preserves selections; toggling off does not clear them', () => {
    const { result } = renderHook(() => useRecurringSwapContext(), {
      wrapper: wrap
    })
    act(() => {
      result.current.setIsRecurring(true)
      result.current.setFrequency({ unit: 'week', value: 4 })
      result.current.setNumberOfOrders(4)
    })
    expect(result.current.frequency).toEqual({ unit: 'week', value: 4 })

    act(() => result.current.setIsRecurring(false))
    expect(result.current.frequency).toEqual({ unit: 'week', value: 4 })
  })

  it('throws when used outside the provider', () => {
    // Silence the React error log for this expected throw
    const spy = jest.spyOn(console, 'error').mockImplementation(jest.fn())
    const { result } = renderHook(() => useRecurringSwapContext())
    expect(result.error).toBeInstanceOf(Error)
    expect(result.error?.message).toMatch(/RecurringSwapContextProvider/)
    spy.mockRestore()
  })
})
