import { warmup } from '../../helpers/warmup'
import createPinPage from '../../pages/createPin.page'

describe('Install older version of app and login', () => {
  beforeAll(async () => {
    await warmup()
    console.log('Logged in successfully!')
    throw new Error('Test failed on purpose!')
  })

  it('should fail', async () => {
    await createPinPage.enterCurrentPin()
    console.log('Test is supposed to fail and you should NOT see this message!')
  })
})
