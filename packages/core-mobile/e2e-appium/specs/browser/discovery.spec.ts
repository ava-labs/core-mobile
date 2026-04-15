import warmup from '../../helpers/warmup'
import bottomTabsPage from '../../pages/bottomTabs.page'
import browserPage from '../../pages/browser.page'
import browserLoc from '../../locators/browser.loc'

describe('Browser - Discovery', () => {
  it('[Smoke] Should open a dApp from the ecosystem carousel and verify URL', async () => {
    await warmup()
    await bottomTabsPage.tapBrowserTab()

    await browserPage.tapFirstEcosystemCarouselItem()
    await browserPage.verifyUrlLoaded()
  })

  it('Should open a trending project via the Open button and verify URL', async () => {
    await bottomTabsPage.tapBrowserTab()
    await browserPage.openNewTabViaMenu()

    await browserPage.tapFirstTrendingProjectOpenBtn()
    await browserPage.verifyUrlLoaded()
  })

  it('Should open a Learn article and navigate to support.core.app', async () => {
    await bottomTabsPage.tapBrowserTab()
    await browserPage.openNewTabViaMenu()

    await browserPage.tapFirstLearnItem()
    await browserPage.verifyUrlContains(browserLoc.supportCoreApp)
  })
})
