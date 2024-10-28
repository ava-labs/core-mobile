import { warmup } from '../../../helpers/warmup'
import actions from '../../../helpers/actions'
import bridgeTabPage from '../../../pages/bridgeTab.page'
import portfolioLoc from '../../../locators/portfolio.loc'
import commonElsPage from '../../../pages/commonEls.page'
import sendPage from '../../../pages/send.page'
import popUpModalPage from '../../../pages/popUpModal.page'
import bridgeTabLoc from '../../../locators/bridgeTab.loc'
import { cleanup } from '../../../helpers/cleanup'

// Please note that the tests here are NOT for completing the bridge transactions,
// but for verifying the bridge screen and its elements'
// Since Bridge Transactions are expensive, we are just testing the flow between networks on e2e daily run.
describe('Bridge Screen', () => {
  beforeAll(async () => {
    await warmup()
  })

  afterAll(async () => {
    await cleanup()
  })

  const networks = [
    { network: portfolioLoc.ethNetwork, token: 'USDC' },
    { network: portfolioLoc.btcNetwork, token: 'BTC' }
  ]
  const platformIndex = actions.platform() === 'ios' ? 1 : 0

  it('should verify the default bridge screen', async () => {
    await bridgeTabPage.goToBridge()
    await bridgeTabPage.verifyBridgeScreen()
    await bridgeTabPage.verifyFromNetwork(bridgeTabLoc.avalancheNetwork)
    await commonElsPage.goBack()
  })

  networks.forEach(({ network, token }) => {
    it(`should change networks via dropdown and bridge toggle button for ${network}`, async () => {
      await bridgeTabPage.goToBridge()

      // select dropdown item > verify `from` and `to` networks updated
      await bridgeTabPage.tapFromNetwork()
      await commonElsPage.tapDropdownItem(network.toLowerCase(), platformIndex)
      await bridgeTabPage.verifyNetworks(network, bridgeTabLoc.avalancheNetwork)

      // Add token before toggling
      await bridgeTabPage.tapSelectToken()
      await sendPage.selectToken(token)

      // Toggle > verify `from` and `to` networks updated
      await bridgeTabPage.tapBridgeToggleBtn()
      await bridgeTabPage.verifyNetworks(bridgeTabLoc.avalancheNetwork, network)
      // Toggle > verify `from` and `to` networks updated
      await bridgeTabPage.tapBridgeToggleBtn()
      await bridgeTabPage.verifyNetworks(network, bridgeTabLoc.avalancheNetwork)

      // Exit bridge screen
      await bridgeTabPage.tapBridgeToggleBtn()
      await commonElsPage.goBack()
    })
  })

  networks.forEach(({ network, token }) => {
    it(`should show Bridge Approval Modal for Avalanche to ${network}`, async () => {
      // Avalanche > Select token with Max amount
      await bridgeTabPage.goToBridge()
      await bridgeTabPage.tapSelectToken()
      await sendPage.selectToken(token)
      await sendPage.tapMax()
      try {
        await actions.waitForElement(bridgeTabPage.error)
      } catch (e) {
        // Verify approve modal with legit fee > Reject
        await bridgeTabPage.tapBridgeBtn()
        await popUpModalPage.verifyFeeIsLegit(false, 0.02)
        await popUpModalPage.tapRejectBtn()
      }
      // Exit bridge screen
      await commonElsPage.goBack()
    })
  })

  networks.forEach(({ network, token }) => {
    it(`should show Bridge Approval Modal for ${network} to Avalanche`, async () => {
      // Select Ethereum network
      await bridgeTabPage.goToBridge()
      await bridgeTabPage.tapFromNetwork()
      await commonElsPage.tapDropdownItem(network.toLowerCase(), platformIndex)

      // Select token. If Ethereum, update token to `ETH`
      await bridgeTabPage.tapSelectToken()
      token = network === portfolioLoc.ethNetwork ? 'ETH' : token
      await sendPage.selectToken(token)
      await sendPage.tapMax()
      try {
        await actions.waitForElement(bridgeTabPage.error)
      } catch (e) {
        // Verify approve modal with legit fee > Reject
        await bridgeTabPage.tapBridgeBtn()
        await popUpModalPage.verifyFeeIsLegit(false, 0.02)
        await popUpModalPage.tapRejectBtn()
      }
      // Exit bridge screen
      await commonElsPage.goBack()
    })
  })
})
