import { warmup } from '../../../helpers/warmup'
import bridgeTabPage from '../../../pages/bridgeTab.page'
import commonElsPage from '../../../pages/commonEls.page'
import bridgeTabLoc from '../../../locators/bridgeTab.loc'
import { setWebViewId } from '../../../helpers/web'

// Please note that the tests here are NOT for completing the bridge transactions,
// but for verifying the bridge screen and its elements'
// Since Bridge Transactions are expensive, we are just testing the flow between networks on e2e daily run.
describe('Holliday Bridge Flow', () => {
  beforeAll(async () => {
    await warmup()
    setWebViewId('halliday-bridge-webview')
  })

  it('should verify the default bridge screen', async () => {
    await bridgeTabPage.goToBridge()
    await bridgeTabPage.verifyHollidayBanner()
    await bridgeTabPage.tapHollidayBanner()
    await bridgeTabPage.verifyBridgeScreen()
    await bridgeTabPage.verifyFromNetwork(bridgeTabLoc.avalancheNetwork)
    await commonElsPage.goBack()
  })
})
