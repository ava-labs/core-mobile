import assertions from '../../helpers/assertions'
import { warmup } from '../../helpers/warmup'
import PortfolioPage from '../../pages/portfolio.page'

describe('Change Pin', () => {
  beforeAll(async () => {
    await warmup()
  })

  it('Should verify Defi Items', async () => {
    await device.disableSynchronization()
    await assertions.isVisible(PortfolioPage.colectiblesTab)
  })
})
