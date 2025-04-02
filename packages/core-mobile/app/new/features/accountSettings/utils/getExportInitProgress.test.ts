import { getExportInitProgress } from './getExportInitProgress'

describe('getExportInitProgress', () => {
  it('should return isInProgress as true when current time is less than availableAt', () => {
    const availableAt = Math.floor(Date.now() / 1000) + 60 // 1 minute in the future
    const availableUntil = availableAt + 3600 // 1 hour later

    const result = getExportInitProgress(availableAt, availableUntil)

    expect(result.isInProgress).toBe(true)
    expect(result.isReadyToDecrypt).toBe(false)
    expect(result.isExpired).toBe(false)
  })

  it('should return isReadyToDecrypt as true when current time is between availableAt and availableUntil', () => {
    const availableAt = Math.floor(Date.now() / 1000) - 60 // 1 minute in the past
    const availableUntil = availableAt + 3600 // 1 hour later

    const result = getExportInitProgress(availableAt, availableUntil)

    expect(result.isInProgress).toBe(false)
    expect(result.isReadyToDecrypt).toBe(true)
    expect(result.isExpired).toBe(false)
  })

  it('should return isExpired as true when current time is greater than availableUntil', () => {
    const availableAt = Math.floor(Date.now() / 1000) - 7200 // 2 hours in the past
    const availableUntil = availableAt + 3600 // 1 hour later

    const result = getExportInitProgress(availableAt, availableUntil)

    expect(result.isInProgress).toBe(false)
    expect(result.isReadyToDecrypt).toBe(false)
    expect(result.isExpired).toBe(true)
  })
})
