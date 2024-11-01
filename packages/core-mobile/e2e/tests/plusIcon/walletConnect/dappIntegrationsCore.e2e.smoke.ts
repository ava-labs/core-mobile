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
import wbs from '../../../helpers/web'

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
    await wbs.verifyUrl('https://core.app/')
    try {
      await wbs.waitForEleByTextToBeVisible('Error:')
      console.log('Unable to load `core.app` website')
    } catch (e) {
      await browserPage.tapAccept()
      await browserPage.tapCoreConnectWallet()
      await browserPage.tapConnectWallet()
      await browserPage.connectTermAndContinue()
      await browserPage.connectCore()
      await connectToSitePage.selectAccountAndconnect()
      await securityAndPrivacyPage.goToConnectedSites()
      await connectedSitesPage.verifyDapp('Core')
    }
  }, 60000)

  it('should disconnect core.app', async () => {
    await connectedSitesPage.disconnectDapp('Core')
    await connectedSitesPage.verifyEmtpyConnectedSites()
  })
})
