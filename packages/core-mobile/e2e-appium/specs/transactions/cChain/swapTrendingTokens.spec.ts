import warmup from '../../../helpers/warmup'
import bottomTabsPage from '../../../pages/bottomTabs.page'
import txPage from '../../../pages/transactions.page'

describe('Swap on C-Chain', () => {
  it(`Should swap AVAX to No.1 trending token`, async () => {
    await warmup()
    await bottomTabsPage.tapTrackTab()
    await txPage.swapOnTrack()
    await txPage.verifySuccessToast()
  })
})
