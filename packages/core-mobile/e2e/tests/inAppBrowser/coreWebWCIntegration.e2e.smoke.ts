/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./environment.ts
 */
import { warmup } from '../../helpers/warmup'
import BottomTabsPage from '../../pages/bottomTabs.page'
import actions from '../../helpers/actions'
import browserPage from '../../pages/browser.page'
import commonElsPage from '../../pages/commonEls.page'
import delay from '../../helpers/waits'
import securityAndPrivacyPage from '../../pages/burgerMenu/securityAndPrivacy.page'
import connectedSitesPage from '../../pages/connectedSites.page'

describe('Connect to dApp using WalletConnect', () => {
  beforeAll(async () => {
    await warmup()
  })

  it('should navigate core.app page', async () => {
    await actions.waitForElement(BottomTabsPage.plusIcon)
    await BottomTabsPage.tapBrowserTab()
    await commonElsPage.tapGetStartedButton()
    await browserPage.tapSearchBar()
    await browserPage.enterBrowserSearchQuery('core.app')
  })

  it('should connect dApp in InAppBrowser', async () => {
    await delay(5000)
    await browserPage.tapAccept()
    await browserPage.tapConnectWallet()
    await browserPage.tapWalletConnect()
    await browserPage.connectTermAndContinue()
    await browserPage.connectCore()
    await delay(5000)
    await browserPage.selectAccountAndconnect()
    await browserPage.verifyDappConnected()
  })

  it('should show up connected ', async () => {
    await securityAndPrivacyPage.goToConnectedSites()
    await connectedSitesPage.verifyCoreDapp()
  })

  it('should disconnect core.app', async () => {
    await connectedSitesPage.disconnectDapp('Core')
    await connectedSitesPage.verifyEmtpyConnectedSites()
  })
})
