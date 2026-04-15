import warmup from '../../helpers/warmup'
import bottomTabsPage from '../../pages/bottomTabs.page'
import browserPage from '../../pages/browser.page'
import browserLoc from '../../locators/browser.loc'
import { actions } from '../../helpers/actions'

describe('Browser - Discovery', () => {
  it('Should navigate to Discovery dapp', async () => {
    await warmup()
    await bottomTabsPage.tapBrowserTab()

    await browserPage.tapFirstEcosystemCarouselItem()
    await browserPage.verifyUrlLoaded()
  })

  it('Should navigate to a trending project', async () => {
    await browserPage.removeAllTabs()
    await browserPage.tapFirstTrendingProjectOpenBtn()
    await browserPage.verifyUrlLoaded()
  })

  it('Should navigate to a Learn article', async () => {
    await browserPage.removeAllTabs()
    await browserPage.tapFirstLearnItem()
    await browserPage.verifyUrlContains(browserLoc.supportCoreApp)
  })

  it('Should navigates to suggested dApps', async () => {
    await browserPage.removeAllTabs()
    await actions.tap(browserPage.searchBar)
    await browserPage.tapFirstSuggestedItem()
    await browserPage.verifyUrlLoaded()
  })
})
