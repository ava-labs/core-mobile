import { warmup } from '../../../helpers/warmup'
import browserPage from '../../../pages/browser.page'
import popUpModalPage from '../../../pages/popUpModal.page'
import swapTabPage from '../../../pages/swapTab.page'

describe('Dapp Swap', () => {
  beforeEach(async () => {
    await warmup(true)
  })

  it('should swap via LFJ', async () => {
    await browserPage.connect('https://lfj.gg/avalanche')
    await browserPage.swapLFJ()
    await popUpModalPage.verifyFeeIsLegit(true, false, 0.2)
    await swapTabPage.tapApproveButton()
  })

  it('should swap via UniSwap', async () => {
    await browserPage.connect('https://app.uniswap.org/')
    await browserPage.swapUniSwap()
    await popUpModalPage.verifyFeeIsLegit(true, false, 0.2)
    await swapTabPage.tapApproveButton()
  })
})
