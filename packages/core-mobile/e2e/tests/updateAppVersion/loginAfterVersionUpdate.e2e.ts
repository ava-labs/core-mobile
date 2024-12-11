import assertions from '../../helpers/assertions'
import portfolioPage from '../../pages/portfolio.page'
import { warmup } from '../../helpers/warmup'

describe('Verify version update', () => {
  beforeAll(async () => {
    await warmup()
  })

  it('should verify version update', async () => {
    await device.launchApp({ newInstance: false })
    await assertions.isVisible(portfolioPage.colectiblesTab)
  })
})
