import { memoizeByReference } from './memoizeByReference'

describe('memoizeByReference', () => {
  it('should not recompute when every argument is reference-equal', () => {
    const fn = jest.fn((a: object, b: boolean) => ({ a, b }))
    const memoized = memoizeByReference(fn)
    const arg = {}

    const first = memoized(arg, false)
    const second = memoized(arg, false)

    expect(fn).toHaveBeenCalledTimes(1)
    expect(second).toBe(first)
  })

  it('should recompute when any argument changes identity', () => {
    const fn = jest.fn((a: object) => ({ a }))
    const memoized = memoizeByReference(fn)

    const first = memoized({})
    const second = memoized({})

    expect(fn).toHaveBeenCalledTimes(2)
    expect(second).not.toBe(first)
  })

  it('should recompute when a primitive argument changes value', () => {
    const fn = jest.fn((flag: boolean) => ({ flag }))
    const memoized = memoizeByReference(fn)
    const first = memoized(false)

    const second = memoized(true)
    const third = memoized(false)

    expect(fn).toHaveBeenCalledTimes(3)
    expect(second).not.toBe(first)
    // cache size is 1, so going back to a previous argument recomputes
    expect(third).not.toBe(first)
  })

  it('should treat undefined arguments as values rather than cache misses', () => {
    const fn = jest.fn((a: object | undefined) => ({ a }))
    const memoized = memoizeByReference(fn)

    const first = memoized(undefined)
    const second = memoized(undefined)

    expect(fn).toHaveBeenCalledTimes(1)
    expect(second).toBe(first)
  })

  it('should cache a call with no arguments', () => {
    const fn = jest.fn(() => ({}))
    const memoized = memoizeByReference(fn)

    const first = memoized()
    const second = memoized()

    expect(fn).toHaveBeenCalledTimes(1)
    expect(second).toBe(first)
  })
})
