import { warmup } from '../../../helpers/warmup'
import activityTabPage from '../../../pages/activityTab.page'
import portfolioPage from '../../../pages/portfolio.page'
import SendPage from '../../../pages/send.page'
import SwapTabPage from '../../../pages/swapTab.page'

describe('Swap', () => {
  beforeAll(async () => {
    await warmup(true)
  })

  it('Should swap AVAX to ERC20', async () => {
    await SwapTabPage.swap('AVAX', 'USDC')
    await SendPage.verifySuccessToast()
  })

  it('Should swap ERC20 to AVAX', async () => {
    await SwapTabPage.swap('USDC', 'AVAX', '0.001')
    await SendPage.verifySuccessToast()
  })

  it('Should swap ERC20 to ERC20', async () => {
    await SwapTabPage.swap('USDC', 'USDT', '0.0001')
    await SendPage.verifySuccessToast()
  })

  it('Should verify swap transaction on Activity tab', async () => {
    await portfolioPage.goToActivityTab()
    await activityTabPage.verifyNewRow('Contract Call', '-0.001 USDC')
  })
})
