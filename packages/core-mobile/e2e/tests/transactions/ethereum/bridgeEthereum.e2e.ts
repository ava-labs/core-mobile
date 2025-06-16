import { warmup } from '../../../helpers/warmup'
import bridgeTabPage from '../../../pages/bridgeTab.page'
import commonElsPage from '../../../pages/commonEls.page'
import sendPage from '../../../pages/send.page'
import popUpModalPage from '../../../pages/popUpModal.page'
import { cleanup } from '../../../helpers/cleanup'
import bottomTabsPage from '../../../pages/bottomTabs.page'
import portfolioPage from '../../../pages/portfolio.page'

// Please note that the tests here are NOT for completing the bridge transactions,
// but for verifying the bridge screen and its elements'
// Since Bridge Transactions are expensive, we are just testing the flow between networks on e2e daily run.
describe('Bridge Ethereum', () => {
  beforeAll(async () => {
    await warmup()
  })

  afterAll(async () => {
    await cleanup()
  })

  it(`should verify Bridge Flow from Ethereum to Avalanche`, async () => {
    await bottomTabsPage.tapPortfolioTab()
    await portfolioPage.tapNetworksDropdown()
    await portfolioPage.tapNetworksDropdownETH()
    await bridgeTabPage.goToBridge()
    await bridgeTabPage.tapSelectToken()
    await sendPage.tapMax()
    await bridgeTabPage.tapBridgeBtn()
    await popUpModalPage.verifyFeeIsLegit(false, false, 0.02)
    await popUpModalPage.tapRejectBtn()
    await commonElsPage.goBack()
  })
})
