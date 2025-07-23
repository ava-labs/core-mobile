import { warmup } from '../../../helpers/warmup'
import commonElsPage from '../../../pages/commonEls.page'
import SwapTabPage from '../../../pages/swapTab.page'

describe('Swap', () => {
  beforeAll(async () => {
    await warmup()
  })

  it('Should swap AVAX to ERC20', async () => {
    await SwapTabPage.swap('AVAX', 'USDC', '0.00001')
    await commonElsPage.verifySuccessToast()
  })

  it('Should swap ERC20 to AVAX', async () => {
    await SwapTabPage.swap('USDC', 'AVAX', '0.0001')
    await commonElsPage.verifySuccessToast()
  })

  it('Should swap ERC20 to ERC20', async () => {
    await SwapTabPage.swap('USDC', 'USDT', '0.0001')
    await commonElsPage.verifySuccessToast()
  })
})
