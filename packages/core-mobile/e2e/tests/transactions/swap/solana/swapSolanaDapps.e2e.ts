import { warmup } from '../../../../helpers/warmup'
import browserPage from '../../../../pages/browser.page'
import commonElsPage from '../../../../pages/commonEls.page'
import popUpModalPage from '../../../../pages/popUpModal.page'

describe('Swap on Solana Dapps', () => {
  beforeEach(async () => {
    await warmup(true)
  })

  it('should swap via orca', async () => {
    await browserPage.connectLFJ()
    await browserPage.swapLFJ()
    await popUpModalPage.verifyFeeIsLegit(true, false, 0.2)
    await commonElsPage.tapApproveButton()
  })

  it('should swap via jup', async () => {
    await browserPage.connect('https://app.uniswap.org/')
    await browserPage.swapUniSwap()
    await popUpModalPage.verifyFeeIsLegit(true, false, 0.2)
    await commonElsPage.tapApproveButton()
  })
})
