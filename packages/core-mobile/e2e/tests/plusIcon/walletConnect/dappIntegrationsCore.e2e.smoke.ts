/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./environment.ts
 */
import { warmup } from '../../../helpers/warmup'
import BottomTabsPage from '../../../pages/bottomTabs.page'
import actions from '../../../helpers/actions'
import browserPage from '../../../pages/browser.page'
import commonElsPage from '../../../pages/commonEls.page'
import securityAndPrivacyPage from '../../../pages/burgerMenu/securityAndPrivacy.page'
import connectedSitesPage from '../../../pages/connectedSites.page'
import connectToSitePage from '../../../pages/connectToSite.page'

describe('Dapp - Core', () => {
  beforeAll(async () => {
    await warmup()
  })

  it('should connect core.app', async () => {
    await actions.waitForElement(BottomTabsPage.plusIcon)
    await BottomTabsPage.tapBrowserTab()
    await commonElsPage.tapGetStartedButton()
    await browserPage.tapSearchBar()
    await browserPage.enterBrowserSearchQuery('core.app')
    await browserPage.verifyInAppBrowserLoaded('https://core.app/')
    await browserPage.tapAccept()
    await browserPage.tapCoreConnectWallet()
    await browserPage.tapConnectWallet()
    await browserPage.connectTermAndContinue()
    await browserPage.connectCore()
    await connectToSitePage.selectAccountAndconnect()
  })

  it('should verify core.app connected', async () => {
    await securityAndPrivacyPage.goToConnectedSites()
    await connectedSitesPage.verifyDapp('Core')
  })

  it('should verify core.app disconnected', async () => {
    await connectedSitesPage.disconnectDapp('Core')
    await connectedSitesPage.verifyEmtpyConnectedSites()
  })
})
