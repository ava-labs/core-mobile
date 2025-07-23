import assertions from '../../helpers/assertions'
import { warmup } from '../../helpers/warmup'
import portfolioPage from '../../pages/portfolio.page'

describe('Install older version of app and login', () => {
  beforeAll(async () => {
    await warmup()
    console.log('Logged in successfully!')
  })

  it('Verify collectibles tab is displayed', async () => {
    console.log('verifying collectibles tab is visible...')
    await assertions.isVisible(portfolioPage.colectiblesTab)
    await device.terminateApp()
  })
})
