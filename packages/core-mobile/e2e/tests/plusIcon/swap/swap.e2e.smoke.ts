import { warmup } from '../../../helpers/warmup'
import activityTabPage from '../../../pages/activityTab.page'
import portfolioPage from '../../../pages/portfolio.page'
import SendPage from '../../../pages/send.page'
import SwapTabPage from '../../../pages/swapTab.page'

describe('Swap AVAX', () => {
  beforeAll(async () => {
    await warmup()
  })

  it('Should swap AVAX <> USDC', async () => {
    await SwapTabPage.swap('AVAX', 'USDC')
    await SendPage.verifySuccessToast()
  })

  it('Should swap USDC <> AVAX', async () => {
    await SwapTabPage.swap('USDC', 'AVAX', '0.001')
    await SendPage.verifySuccessToast()
  })

  it('Should verify swap transaction in Activity', async () => {
    await portfolioPage.goToActivityTab()
    await activityTabPage.verifyNewRow('Contract Call', '-0.001 USDC')
  })
})
