import React from 'react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { act, renderHook } from '@testing-library/react-hooks'
import { securityReducer } from 'store/security/slice'
import {
  getTimeoutForAttempt,
  MAX_ATTEMPTS_BEFORE_LOCKOUT,
  useRateLimiter
} from './useRateLimiter'

const createStore = (
  loginAttempt = { count: 0, countdown: 0 }
): ReturnType<typeof configureStore> =>
  configureStore({
    reducer: { security: securityReducer },
    preloadedState: { security: { loginAttempt } }
  })

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const renderRateLimiter = (store = createStore()) => {
  const wrapper = ({
    children
  }: {
    children: React.ReactNode
  }): React.JSX.Element => <Provider store={store}>{children}</Provider>
  return { store, ...renderHook(() => useRateLimiter(), { wrapper }) }
}

describe('getTimeoutForAttempt', () => {
  it.each([
    [1, 0],
    [2, 0],
    [3, 0],
    [4, 0],
    [5, 60],
    [6, 300],
    [7, 900],
    [8, 3600],
    [9, 3600],
    [20, 3600]
  ])('failed attempt %i → %i seconds lockout', (attempt, expected) => {
    expect(getTimeoutForAttempt(attempt)).toBe(expected)
  })

  it('starts the lockout after the 5th failed attempt (WSR-PHYS-002)', () => {
    expect(MAX_ATTEMPTS_BEFORE_LOCKOUT).toBe(5)
    expect(getTimeoutForAttempt(MAX_ATTEMPTS_BEFORE_LOCKOUT - 1)).toBe(0)
    expect(getTimeoutForAttempt(MAX_ATTEMPTS_BEFORE_LOCKOUT)).toBeGreaterThan(0)
  })
})

describe('useRateLimiter', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('allows the first 4 failed attempts and locks out on the 5th', () => {
    const { result, store } = renderRateLimiter()

    for (let i = 1; i <= 4; i++) {
      act(() => result.current.increaseAttempt())
      expect(result.current.attemptAllowed).toBe(true)
      expect(result.current.remainingSeconds).toBe(0)
    }

    act(() => result.current.increaseAttempt())
    expect(result.current.attemptAllowed).toBe(false)
    expect(result.current.remainingSeconds).toBe(60)
    expect(
      (store.getState() as { security: { loginAttempt: unknown } }).security
        .loginAttempt
    ).toEqual({ count: 5, countdown: 60 })
  })

  it('counts down and allows another attempt once the lockout expires', () => {
    const { result } = renderRateLimiter(
      createStore({ count: 4, countdown: 0 })
    )

    act(() => result.current.increaseAttempt())
    expect(result.current.remainingSeconds).toBe(60)

    act(() => {
      jest.advanceTimersByTime(1000)
    })
    expect(result.current.remainingSeconds).toBe(59)

    for (let i = 0; i < 59; i++) {
      act(() => {
        jest.advanceTimersByTime(1000)
      })
    }
    expect(result.current.remainingSeconds).toBe(0)
    expect(result.current.attemptAllowed).toBe(true)

    // 6th failure escalates to 5 minutes
    act(() => result.current.increaseAttempt())
    expect(result.current.remainingSeconds).toBe(300)
  })

  it('resumes a persisted lockout (count survives restarts)', () => {
    const { result } = renderRateLimiter(
      createStore({ count: 7, countdown: 120 })
    )
    expect(result.current.attemptAllowed).toBe(false)
    expect(result.current.remainingSeconds).toBe(120)

    act(() => {
      jest.advanceTimersByTime(120 * 1000)
    })
    expect(result.current.attemptAllowed).toBe(true)

    // next failure after a persisted 7 → 8th → 60 minutes
    act(() => result.current.increaseAttempt())
    expect(result.current.remainingSeconds).toBe(3600)
  })

  it('reset clears the counter so the next failure is attempt 1 again', () => {
    const { result } = renderRateLimiter(
      createStore({ count: 6, countdown: 300 })
    )

    act(() => result.current.reset())
    expect(result.current.attemptAllowed).toBe(true)
    expect(result.current.remainingSeconds).toBe(0)

    act(() => result.current.increaseAttempt())
    expect(result.current.remainingSeconds).toBe(0)
  })
})
