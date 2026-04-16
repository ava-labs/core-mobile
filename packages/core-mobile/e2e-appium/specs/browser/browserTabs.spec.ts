import warmup from '../../helpers/warmup'
import bottomTabsPage from '../../pages/bottomTabs.page'
import browserPage from '../../pages/browser.page'
import browserLoc from '../../locators/browser.loc'

describe('Browser - Tab Management', () => {
  it('Should be able to add tabs', async () => {
    await warmup()
    await bottomTabsPage.tapBrowserTab()

    // go to core
    await browserPage.goToUrl(browserLoc.core)
    await browserPage.verifyUrl(browserLoc.injectedCore)

    // add tab and go to aave
    await browserPage.tapTabsBtn()
    await browserPage.tapTabsAddBtn()
    await browserPage.goToUrl(browserLoc.aave)
    await browserPage.verifyUrl(browserLoc.aave)
  })

  it('Should be able to close tabs', async () => {
    await browserPage.removeAllTabs()
  })

  it('Should close all tabs via the more menu', async () => {
    await browserPage.tapTabsBtn()
    await browserPage.tapTabsMoreBtn()
    await browserPage.tapCloseAllTabsMenu()

    // Verify we're back on the browser
    await browserPage.verifyBrowserDiscoveryScreen()
  })

  it('Should clear all history via the more menu', async () => {
    await browserPage.tapTabsBtn()
    await browserPage.tapTabsMoreBtn()
    await browserPage.tapBrowsingHistoryMenu()

    // Verify we're on the history screen
    await browserPage.verifyHistoryScreen()

    // Clear all history and verify empty state
    await browserPage.tapClearAllHistory()
    await browserPage.verifyNoHistory()
  })
})
