import { warmup } from '../../helpers/warmup'

describe('Install older version of app and login', () => {
  beforeAll(async () => {
    await warmup()
    console.log('warmup is done!')
  })

  it('should fail', async () => {
    console.log('Test is supposed to pass and you should see this message!')
  })
})
