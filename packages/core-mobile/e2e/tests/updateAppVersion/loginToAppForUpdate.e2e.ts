import assertions from '../../helpers/assertions'
import { warmup } from '../../helpers/warmup'
import portfolioPage from '../../pages/portfolio.page'

describe('Install older version of app and login', () => {
  beforeAll(async () => {
    await warmup()
    console.log('Logged in successfully!')
    device.reloadReactNative()
  })

  it('should fail', async () => {
    console.log('verifying collectibles tab is visible...')
    assertions.isVisible(portfolioPage.colectiblesTab)
  })
})
