import { warmup } from '../../../helpers/warmup'
import bridgeTabPage from '../../../pages/bridgeTab.page'
import Wbs, { setWebViewId } from '../../../helpers/web'
import browserPage from '../../../pages/browser.page'
import connectToSitePage from '../../../pages/connectToSite.page'
import popUpModalPage from '../../../pages/popUpModal.page'

describe('Holliday Bridge Flow', () => {
  beforeAll(async () => {
    await warmup()
    setWebViewId('halliday-bridge-webview')
  })

  it('should verify the default bridge screen', async () => {
    await bridgeTabPage.goToBridge()
    await bridgeTabPage.verifyHollidayBanner()
    await bridgeTabPage.tapHollidayBanner()
    await browserPage.tapAccept()
    await browserPage.tapCoreConnectWallet()
    await browserPage.connectTermAndContinue()
    await browserPage.connectCore()
    await connectToSitePage.selectAccountAndconnect()
    await Wbs.waitForEleByTextToBeVisible('Buy Details')
    await Wbs.tapByText('Choose the network where you want to buy tokens')
    await Wbs.tapByText('Avalanche (C-Chain)')
    await Wbs.tapByText('Which token do you want to buy?')
    await Wbs.tapByText('AVAX')
    await Wbs.tapByText('Continue to Halliday')
    await Wbs.waitForEleByTextToBeVisible('Halliday Onramp')
    await popUpModalPage.verifySignMessageModal()
    await popUpModalPage.tapApproveBtn()
    await Wbs.waitForEleByTextToBeVisible('Halliday Onramp')
  })
})
