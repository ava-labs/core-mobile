import { exponentialBackoff } from 'utils/js/exponentialBackoff'

describe('utils/exponentialBackoff', () => {
  it('should last 1 second when succeeds on 2nd try', async () => {
    const startTs = new Date().getTime()
    let counter = 0
    const getAndIncrementCounter = async () => {
      return counter++
    }
    await exponentialBackoff(getAndIncrementCounter, result => result === 1)
    const elapsedTimeMs = new Date().getTime() - startTs
    expect(elapsedTimeMs).toBeGreaterThanOrEqual(1000)
    expect(elapsedTimeMs).toBeLessThan(1100)
  })

  it('should last 3 seconds when succeeds on 3rd try', async () => {
    const startTs = new Date().getTime()
    let counter = 0
    const getAndIncrementCounter = async () => {
      return counter++
    }
    await exponentialBackoff(getAndIncrementCounter, result => result === 2)
    const elapsedTimeMs = new Date().getTime() - startTs
    expect(elapsedTimeMs).toBeGreaterThanOrEqual(3000)
    expect(elapsedTimeMs).toBeLessThan(3100)
  })

  it('should throw error if exceeds max retry count', async () => {
    let counter = 0
    const getAndIncrementCounter = async () => {
      return counter++
    }
    let errMsg
    try {
      await exponentialBackoff(
        getAndIncrementCounter,
        result => result === 2,
        1
      )
    } catch (e) {
      errMsg = (e as Error).message
    }
    expect(errMsg).toEqual('Max retry exceeded.')
  })
})
