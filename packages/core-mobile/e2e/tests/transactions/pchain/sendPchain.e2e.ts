import sendPage from '../../../pages/send.page'
import sendLoc from '../../../locators/send.loc'
import portfolioPage from '../../../pages/portfolio.page'
import { warmup } from '../../../helpers/warmup'
import settingsPage from '../../../pages/settings.page'
import commonElsLoc from '../../../locators/commonEls.loc'
import commonElsPage from '../../../pages/commonEls.page'
import tokenDetailPage from '../../../pages/tokenDetail.page'

describe('Send on P-Chain', () => {
  beforeAll(async () => {
    await warmup()
    await settingsPage.createNthAccount()
    await portfolioPage.filterNetwork(commonElsLoc.pChain)
    await portfolioPage.tapToken()
  })

  it('should send AVAX on P-Chain', async () => {
    await tokenDetailPage.verifyPXChainTokenDetail()
    // undefined token means the default token from the token detail
    await sendPage.send(undefined, sendLoc.sendingAmount)
    await commonElsPage.verifySuccessToast()
  })
})
