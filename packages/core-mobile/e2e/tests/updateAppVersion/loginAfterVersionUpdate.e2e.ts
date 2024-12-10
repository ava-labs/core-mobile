// import assertions from '../../helpers/assertions'
// import portfolioPage from '../../pages/portfolio.page'
import { warmup } from '../../helpers/warmup'

describe('Verify version update', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: false })
    await device.disableSynchronization()
  })

  it('should verify version update', async () => {
    await warmup()
    await device.terminateApp()
  })
})
