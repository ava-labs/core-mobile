import { warmup } from '../../../../helpers/warmup'
import bottomTabsPage from '../../../../pages/bottomTabs.page'
import commonElsPage from '../../../../pages/commonEls.page'
import swapTabPage from '../../../../pages/swapTab.page'

describe('Swap Top 5 trending tokens', () => {
  beforeEach(async () => {
    await warmup()
    await bottomTabsPage.tapTrackTab()
  })

  for (let i = 0; i < 5; i++) {
    it(`should swap AVAX to top #${i + 1} trending token`, async () => {
      await swapTabPage.swapOnTrack(i)
      await commonElsPage.verifySuccessToast()
    })
  }
})
