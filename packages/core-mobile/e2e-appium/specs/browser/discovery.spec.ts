import warmup from '../../helpers/warmup'
import bottomTabsPage from '../../pages/bottomTabs.page'
import browserPage from '../../pages/browser.page'
import browserLoc from '../../locators/browser.loc'
import { actions } from '../../helpers/actions'

describe('Browser - Discovery', () => {
  before(async () => {
    await warmup()
    await bottomTabsPage.tapBrowserTab()
  })

  it('Should navigates to suggested dApps', async () => {
    await actions.tap(browserPage.searchBar)
    await browserPage.tapFirstSuggestedItem()
    await browserPage.verifyUrlLoaded()
  })

  it('Should navigate to Discovery dapp', async () => {
    await browserPage.removeAllTabs()
    await browserPage.tapBlazeEcosystemCarouselItem()
    await browserPage.verifyUrlLoaded()
  })

  it('Should navigate to a trending project', async () => {
    await browserPage.removeAllTabs()
    await browserPage.tapTrendingProjectOpenBtn()
    await browserPage.verifyUrlLoaded()
  })

  it('Should navigate to a Learn article', async () => {
    await browserPage.removeAllTabs()
    await browserPage.tapFirstLearnItem()
    await browserPage.verifyUrlContains(browserLoc.supportCoreApp)
  })
})
