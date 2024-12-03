import { warmup } from '../../helpers/warmup'

describe('Verify version update', () => {
  beforeAll(async () => {
    await warmup()
    await device.disableSynchronization()
    fail('not supposed to pass, dont worry about it...')
  })

  it('Should verify Defi Items', async () => {
    fail('not supposed to pass, dont worry about it...')
  })
})
