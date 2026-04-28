import warmup from '../../../helpers/warmup'
import bottomTabsPage from '../../../pages/bottomTabs.page'
import txPage from '../../../pages/transactions.page'

describe('Swap on C-Chain', () => {
  it('[Smoke] Should swap AVAX to ERC20', async () => {
    await warmup()
    await txPage.tapSwap()
    await txPage.quickSwap('0.01')
    await txPage.verifySuccessToast()
  })

  it('Should swap ERC20 to AVAX', async () => {
    await txPage.swap('USDC', 'AVAX', '0.1')
    await txPage.verifySuccessToast()
  })

  it('Should swap ERC20 to ERC20', async () => {
    await txPage.swap('USDC', 'USDT', '0.1')
    await txPage.verifySuccessToast()
  })

  it('Should swap AVAX to the No.1 trending token', async () => {
    await bottomTabsPage.tapTrackTab()
    await txPage.swapOnTrack()
    await txPage.verifySuccessToast()
  })
})
