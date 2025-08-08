import { warmup } from '../../../../helpers/warmup'
import commonElsPage from '../../../../pages/commonEls.page'
import SwapTabPage from '../../../../pages/swapTab.page'

describe('Swap on Solana', () => {
  beforeAll(async () => {
    await warmup()
  })

  it('Should swap SOL to SPL', async () => {
    await SwapTabPage.swap('SOL', 'USDC', '0.00001')
    await commonElsPage.verifySuccessToast()
  })

  it('Should swap SPL to SOL', async () => {
    await SwapTabPage.swap('USDC', 'SOL', '0.0001')
    await commonElsPage.verifySuccessToast()
  })

  it('Should swap SPL to SPL', async () => {
    await SwapTabPage.swap('USDC', 'JUP', '0.0001')
    await commonElsPage.verifySuccessToast()
  })
})
