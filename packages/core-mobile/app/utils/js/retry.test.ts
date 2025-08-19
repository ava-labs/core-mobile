import { retry } from 'utils/js/retry'

describe('success case', () => {
  it('should last 1 second when succeeds on 2nd try', async () => {
    const startTs = new Date().getTime()
    let counter = 0
    const getAndIncrementCounter = async () => {
      return counter++
    }
    const output = await retry({
      operation: getAndIncrementCounter,
      shouldStop: result => result === 1
    })
    const elapsedTimeMs = new Date().getTime() - startTs
    expect(elapsedTimeMs).toBeGreaterThanOrEqual(1000)
    expect(elapsedTimeMs).toBeLessThan(1100)

    expect(output).toBe(1)
  })

  it('should last 3 seconds when succeeds on 3rd try', async () => {
    const startTs = new Date().getTime()
    let counter = 0
    const getAndIncrementCounter = async () => {
      return counter++
    }
    const output = await retry({
      operation: getAndIncrementCounter,
      shouldStop: result => result === 2
    })
    const elapsedTimeMs = new Date().getTime() - startTs
    expect(elapsedTimeMs).toBeGreaterThanOrEqual(3000)
    expect(elapsedTimeMs).toBeLessThan(3100)

    expect(output).toBe(2)
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

  it('should stop polling when isStopping is true', async () => {
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
