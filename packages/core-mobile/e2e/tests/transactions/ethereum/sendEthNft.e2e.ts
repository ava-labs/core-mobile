import { warmup } from '../../../helpers/warmup'
import sendPage from '../../../pages/send.page'
import settingsPage from '../../../pages/settings.page'
import portfolioPage from '../../../pages/portfolio.page'
import commonElsLoc from '../../../locators/commonEls.loc'
import commonElsPage from '../../../pages/commonEls.page'

describe('Send NFT', () => {
  beforeAll(async () => {
    await warmup()
    await settingsPage.createNthAccount()
  })

  it('should send NFT on Ethereum network', async () => {
    await portfolioPage.tapCollectiblesTab()
    await portfolioPage.filterNetwork(commonElsLoc.ethereum)
    await portfolioPage.selectView()
    await sendPage.sendNFT('Untitled') // the only NFT `Untitled` on Ethereum network on the testing wallet
    await commonElsPage.verifySuccessToast()
  })

  it('should verify the NFT Sent history', async () => {
    // currently not supported
    // TODO: add verification after all transactions history is supported
  })
})
