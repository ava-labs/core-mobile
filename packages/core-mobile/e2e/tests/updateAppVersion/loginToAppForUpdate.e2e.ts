import assertions from '../../helpers/assertions'
import { warmup } from '../../helpers/warmup'
import PortfolioPage from '../../pages/portfolio.page'

describe('Verify version update', () => {
  beforeAll(async () => {
    await warmup()
    await device.disableSynchronization()
  })

  it('Should verify Defi Items', async () => {
    await assertions.isVisible(PortfolioPage.colectiblesTab)
  })
})
