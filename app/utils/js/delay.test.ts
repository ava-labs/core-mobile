import delay from 'utils/js/delay'

describe('utils/delay', () => {
  it('should resolve promise after set delay', async () => {
    const startTs = new Date().getTime()
    await delay(250)
    const elapsedTimeMs = new Date().getTime() - startTs
    expect(elapsedTimeMs).toBeGreaterThanOrEqual(250)
    expect(elapsedTimeMs).toBeLessThan(260)
  })
})
