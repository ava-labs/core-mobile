import warmup from '../../helpers/warmup'
import bottomTabsPage from '../../pages/bottomTabs.page'
import browserPage from '../../pages/browser.page'
import browserLoc from '../../locators/browser.loc'
import { actions } from '../../helpers/actions'
import { selectors } from '../../helpers/selectors'

describe('Browser - Tab Management', () => {
  it('[Smoke] Should close a tab via the X button', async () => {
    await warmup()
    await bottomTabsPage.tapBrowserTab()

    // Navigate to a URL so the tab has content
    await browserPage.goToUrl(browserLoc.core)

    // Open tabs screen and add a second tab so we don't close the last one
    await browserPage.tapTabsBtn()
    await browserPage.tapTabsAddBtn()

    // Navigate in the new tab so it has content too
    await browserPage.goToUrl(browserLoc.aave)

    // Open tabs screen again — now 2 tabs are visible
    await browserPage.tapTabsBtn()

    // Close the first visible tab via the X button
    await browserPage.tapTabItemCloseBtn()

    // Verify we're back on the browser with the remaining tab
    await actions.waitFor(browserPage.searchBar)
  })

  it('Should add a new tab via the + button in the tabs screen', async () => {
    await bottomTabsPage.tapBrowserTab()

    // Open tabs screen
    await browserPage.tapTabsBtn()

    // Tap + to add a new empty tab — navigates back to browser automatically
    await browserPage.tapTabsAddBtn()

    // The new empty tab shows the Discover page — search bar should be visible
    await actions.waitFor(browserPage.searchBar)
  })

  it('Should close all tabs via the more menu', async () => {
    await bottomTabsPage.tapBrowserTab()
    await browserPage.goToUrl(browserLoc.core)

    // Open tabs screen
    await browserPage.tapTabsBtn()

    // Open more menu → Close all tabs → confirm
    await browserPage.tapTabsMoreBtn()
    await browserPage.tapCloseAllTabsMenu()

    // Verify we're back on the browser
    await actions.waitFor(browserPage.searchBar)
  })

  it('Should navigate to browsing history via the more menu, clear all, and show empty state', async () => {
    await bottomTabsPage.tapBrowserTab()
    await browserPage.goToUrl(browserLoc.core)

    // Open tabs screen
    await browserPage.tapTabsBtn()

    // Open more menu → Browsing history
    await browserPage.tapTabsMoreBtn()
    await browserPage.tapBrowsingHistoryMenu()

    // Verify we're on the history screen
    await actions.waitFor(selectors.getBySomeText('History'))

    // Clear all history and verify empty state
    await browserPage.tapClearAllHistory()
    await browserPage.verifyNoHistory()
  })
})
