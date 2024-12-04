import { warmup } from '../../helpers/warmup'

describe('Install older version of app and login', () => {
  beforeAll(async () => {
    await warmup()
    await device.disableSynchronization()

    throw new Error('Test is supposed to fail!')
  })

  it('should fail', async () => {
    console.log('Test is supposed to fail and you should not see this message!')
  })
})
