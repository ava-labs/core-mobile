import activityTabPage from '../../../pages/activityTab.page'
import { warmup } from '../../../helpers/warmup'
import SwapTabPage from '../../../pages/swapTab.page'
import SendPage from '../../../pages/send.page'
import portfolioPage from '../../../pages/portfolio.page'

describe('Swap', () => {
  beforeAll(async () => {
    await warmup()
  })

  it('Should swap AVAX to USDC', async () => {
    await SwapTabPage.swap('AVAX', 'USDC')
    await SendPage.verifySuccessToast()
  })

  it('Should verify swap transaction in Activity', async () => {
    await portfolioPage.goToActivityTab()
    await activityTabPage.refreshActivityPage()
    await activityTabPage.verifyNewRow('Contract Call', '-0.00001 AVAX')
  })
})
