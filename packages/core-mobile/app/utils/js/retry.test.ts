import { retry } from 'utils/js/retry'

describe('success case', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should wait 1s backoff when succeeds on 2nd try', async () => {
    let counter = 0
    const getAndIncrementCounter = async () => {
      return counter++
    }
    const outputPromise = retry({
      operation: getAndIncrementCounter,
      shouldStop: result => result === 1
    })

    await Promise.resolve()
    await jest.advanceTimersByTimeAsync(1000)

    await expect(outputPromise).resolves.toBe(1)
  })

  it('should wait 1s then 2s backoff when succeeds on 3rd try', async () => {
    let counter = 0
    const getAndIncrementCounter = async () => {
      return counter++
    }
    const outputPromise = retry({
      operation: getAndIncrementCounter,
      shouldStop: result => result === 2
    })

    await Promise.resolve()
    await jest.advanceTimersByTimeAsync(1000)
    await jest.advanceTimersByTimeAsync(2000)

    await expect(outputPromise).resolves.toBe(2)
  })
})

describe('failure case', () => {
  it('should run operation 2 times when specifying 2 retries', async () => {
    const getAndIncrementCounter = jest.fn().mockImplementation(() => {
      // do nothing
    })
    await expect(async () => {
      await retry({
        operation: getAndIncrementCounter,
        shouldStop: () => false,
        maxRetries: 2
      })
    }).rejects.toThrow('Max retry exceeded.')

    expect(getAndIncrementCounter).toHaveBeenCalledTimes(2)
  })

  it('should run operation 2 times when specifying 2 retries even when operation fails', async () => {
    const getAndIncrementCounter = jest.fn().mockImplementation(() => {
      throw Error('getAndIncrementCounter error')
    })
    await expect(async () => {
      await retry({
        operation: getAndIncrementCounter,
        shouldStop: () => false,
        maxRetries: 2
      })
    }).rejects.toThrow(
      'Max retry exceeded. Error: getAndIncrementCounter error'
    )

    expect(getAndIncrementCounter).toHaveBeenCalledTimes(2)
  })

  it('should stop retrying when shouldStop is true', async () => {
    const getAndIncrementCounter = jest.fn().mockImplementation(() => {
      return 0
    })
    const output = await retry({
      operation: getAndIncrementCounter,
      shouldStop: () => true,
      maxRetries: 2
    })
    expect(output).toBe(0)
    expect(getAndIncrementCounter).toHaveBeenCalledTimes(1)
  })
})
