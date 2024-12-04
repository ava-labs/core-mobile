import { warmup } from '../../../helpers/warmup'
import connectToSitePage from '../../../pages/connectToSite.page'
import plusMenuPage from '../../../pages/plusMenu.page'

describe('Core App Tests', () => {
  it('should connect Core App', async () => {
    await warmup()
    await plusMenuPage.connectWallet()
    await connectToSitePage.selectAccountAndconnect()
  })
})
