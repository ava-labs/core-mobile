import warmup from '../../helpers/warmup'
import bottomTabsPage from '../../pages/bottomTabs.page'
import browserPage from '../../pages/browser.page'
import browserLoc from '../../locators/browser.loc'

describe('Browser - Tab Management', () => {
  it('Should be able to add tabs', async () => {
    await warmup()
    await bottomTabsPage.tapBrowserTab()

    // Navigate to a URL so the tab has content
    await browserPage.goToUrl(browserLoc.core)
    await browserPage.verifyUrl(browserLoc.injectedCore)

    // Open tabs screen and add a second tab so we don't close the last one
    await browserPage.tapTabsBtn()
    await browserPage.tapTabsAddBtn()

    // Navigate in the new tab so it has content too
    await browserPage.goToUrl(browserLoc.aave)
    await browserPage.verifyUrl(browserLoc.aave)
  })

  it('Should be able to close tabs', async () => {
    // Open tabs screen again — now 2 tabs are visible
    await browserPage.tapTabsBtn()
    // Delete core tab
    await browserPage.tapTabItemCloseBtn()
    // Delete aave tab
    await browserPage.tapTabItemCloseBtn()

    await browserPage.verifyBrowserDiscoveryScreen()
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

    // Open more menu → Browsing history
    await browserPage.tapTabsMoreBtn()
    await browserPage.tapBrowsingHistoryMenu()

    // Verify we're on the history screen
    await browserPage.verifyHistoryScreen()

    // Clear all history and verify empty state
    await browserPage.tapClearAllHistory()
    await browserPage.verifyNoHistory()
  })
})
