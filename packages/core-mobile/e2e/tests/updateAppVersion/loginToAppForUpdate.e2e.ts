import { warmup } from '../../helpers/warmup'

describe('Install older version of app and login', () => {
  beforeAll(async () => {
    await warmup()
    await device.disableSynchronization()
    console.log('Test is supposed to fail and this makes it pass!')
    fail('not supposed to pass, dont worry about it...')
  })

  it('Should not reach this section', async () => {
    fail('not supposed to pass, dont worry about it...')
  })
})
