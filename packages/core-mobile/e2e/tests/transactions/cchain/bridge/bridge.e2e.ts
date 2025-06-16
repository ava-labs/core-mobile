import { warmup } from '../../../../helpers/warmup'
import bridgeTabPage from '../../../../pages/bridgeTab.page'
import portfolioLoc from '../../../../locators/portfolio.loc'
import commonElsPage from '../../../../pages/commonEls.page'
import sendPage from '../../../../pages/send.page'
import popUpModalPage from '../../../../pages/popUpModal.page'

// Please note that the tests here are NOT for completing the bridge transactions,
// but for verifying the bridge screen and its elements'
// Since Bridge Transactions are expensive, we are just testing the flow between networks on e2e daily run.
describe('Bridge C-Chain', () => {
  beforeAll(async () => {
    await warmup()
  })

  const networks = [
    { network: portfolioLoc.ethNetwork, token: 'USDC' },
    { network: portfolioLoc.btcNetwork, token: 'BTC.b' }
  ]

  networks.forEach(({ network }) => {
    it(`should verify Bridge Flow from Avalanche to ${network}`, async () => {
      // Avalanche > Select token with Max amount
      await bridgeTabPage.goToBridge()
      await bridgeTabPage.tapSelectToken()
      await sendPage.tapMax()

      // Verify approve modal with legit fee > Reject
      await bridgeTabPage.tapBridgeBtn()
      await popUpModalPage.verifyFeeIsLegit(true, false, 0.02)
      await popUpModalPage.tapRejectBtn()

      // Exit bridge screen
      await commonElsPage.goBack()
    })
  })
})
