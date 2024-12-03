import { warmup } from '../../helpers/warmup'

describe('Install older version of app and login', () => {
  beforeEach(async () => {
    await warmup()
    await device.disableSynchronization()

    fail('not supposed to pass, dont worry about it...')
  })

  it('should fail', async () => {
    console.log('Test is supposed to fail!')
  })
})
