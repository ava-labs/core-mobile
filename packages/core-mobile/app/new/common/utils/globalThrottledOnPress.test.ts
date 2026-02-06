import {
  globalThrottledOnPress,
  resetGlobalThrottle
} from './globalThrottledOnPress'

describe('globalThrottledOnPress', () => {
  let originalDateNow: () => number
  let mockNow: number

  beforeEach(() => {
    originalDateNow = Date.now
    mockNow = 1000
    Date.now = jest.fn(() => mockNow)
    resetGlobalThrottle()
  })

  afterEach(() => {
    Date.now = originalDateNow
    resetGlobalThrottle()
  })

  it('calls the callback on first press', () => {
    const callback = jest.fn()

    globalThrottledOnPress(callback)

    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('blocks subsequent calls within the default throttle duration (300ms)', () => {
    const callback1 = jest.fn()
    const callback2 = jest.fn()

    globalThrottledOnPress(callback1)
    expect(callback1).toHaveBeenCalledTimes(1)

    // Advance time by 100ms (still within 300ms throttle)
    mockNow += 100

    globalThrottledOnPress(callback2)
    expect(callback2).not.toHaveBeenCalled()
  })

  it('allows calls after the throttle duration has passed', () => {
    const callback1 = jest.fn()
    const callback2 = jest.fn()

    globalThrottledOnPress(callback1)
    expect(callback1).toHaveBeenCalledTimes(1)

    // Advance time by 300ms (exactly at throttle boundary)
    mockNow += 300

    globalThrottledOnPress(callback2)
    expect(callback2).toHaveBeenCalledTimes(1)
  })

  it('blocks calls just before the throttle duration ends', () => {
    const callback1 = jest.fn()
    const callback2 = jest.fn()

    globalThrottledOnPress(callback1)
    expect(callback1).toHaveBeenCalledTimes(1)

    // Advance time by 299ms (just before throttle ends)
    mockNow += 299

    globalThrottledOnPress(callback2)
    expect(callback2).not.toHaveBeenCalled()
  })

  it('works with custom throttle duration', () => {
    const callback1 = jest.fn()
    const callback2 = jest.fn()
    const callback3 = jest.fn()

    globalThrottledOnPress(callback1, 500)
    expect(callback1).toHaveBeenCalledTimes(1)

    // Advance time by 400ms (still within 500ms custom throttle)
    mockNow += 400

    globalThrottledOnPress(callback2, 500)
    expect(callback2).not.toHaveBeenCalled()

    // Advance time by another 100ms (now at 500ms)
    mockNow += 100

    globalThrottledOnPress(callback3, 500)
    expect(callback3).toHaveBeenCalledTimes(1)
  })

  it('shares throttle state across multiple calls (singleton behavior)', () => {
    const callbackA = jest.fn()
    const callbackB = jest.fn()
    const callbackC = jest.fn()

    // Simulate press from component A
    globalThrottledOnPress(callbackA)
    expect(callbackA).toHaveBeenCalledTimes(1)

    // Simulate press from component B immediately after
    mockNow += 50
    globalThrottledOnPress(callbackB)
    expect(callbackB).not.toHaveBeenCalled()

    // Simulate press from component C immediately after
    mockNow += 50
    globalThrottledOnPress(callbackC)
    expect(callbackC).not.toHaveBeenCalled()

    // After throttle duration, any component can trigger
    mockNow += 300
    globalThrottledOnPress(callbackB)
    expect(callbackB).toHaveBeenCalledTimes(1)
  })

  it('handles undefined callback gracefully', () => {
    expect(() => {
      globalThrottledOnPress(undefined as unknown as () => void)
    }).not.toThrow()
  })

  it('resets throttle after duration for multiple sequences', () => {
    const callback = jest.fn()

    // First sequence
    globalThrottledOnPress(callback)
    expect(callback).toHaveBeenCalledTimes(1)

    mockNow += 100
    globalThrottledOnPress(callback)
    expect(callback).toHaveBeenCalledTimes(1) // Still blocked

    // Wait for throttle to expire
    mockNow += 300

    // Second sequence
    globalThrottledOnPress(callback)
    expect(callback).toHaveBeenCalledTimes(2)

    mockNow += 100
    globalThrottledOnPress(callback)
    expect(callback).toHaveBeenCalledTimes(2) // Blocked again
  })
})
