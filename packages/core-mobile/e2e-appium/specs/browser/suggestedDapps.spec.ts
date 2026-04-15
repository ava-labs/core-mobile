import warmup from '../../helpers/warmup'
import bottomTabsPage from '../../pages/bottomTabs.page'
import browserPage from '../../pages/browser.page'
import { actions } from '../../helpers/actions'

describe('Browser - Suggested dApps', () => {
  it('[Smoke] Should tap a suggested dApp from the search overlay and verify URL', async () => {
    await warmup()
    await bottomTabsPage.tapBrowserTab()

    // Focus the search bar to reveal the suggested dApps overlay (FavoritesList)
    await actions.waitFor(browserPage.searchBar)
    await actions.tap(browserPage.searchBar)
    await actions.delay(1000)

    // Tap the first suggested dApp in the grid
    await browserPage.tapFirstSuggestedItem()

    // Verify a URL was loaded
    await browserPage.verifyUrlLoaded()
  })
})
