import warmup from '../../helpers/warmup'
import bottomTabsPage from '../../pages/bottomTabs.page'
import browserDiscoverPage from '../../pages/browserDiscover.page'

describe('Browser - Discover', () => {
  it('[Smoke] Should scroll and navigate ecosystem carousel items', async () => {
    await warmup()
    await bottomTabsPage.tapBrowserTab()

    // Tap first visible ecosystem item
    await browserDiscoverPage.tapFirstEcosystemItem()
    await browserDiscoverPage.verifyWebviewLoaded()
    await browserDiscoverPage.verifyUrlLoaded()

    // Navigate back to Discover
    await browserDiscoverPage.goBackToDiscover()

    // Scroll carousel to reveal more items
    await browserDiscoverPage.scrollEcosystemCarousel()

    // Tap the next visible ecosystem item
    await browserDiscoverPage.tapFirstEcosystemItem()
    await browserDiscoverPage.verifyWebviewLoaded()
    await browserDiscoverPage.verifyUrlLoaded()
  })

  it('[Smoke] Should open trending projects via the Open button', async () => {
    await bottomTabsPage.tapBrowserTab()
    await browserDiscoverPage.goBackToDiscover()

    // Scroll down to see trending projects
    await browserDiscoverPage.scrollDiscoverPage()

    // Tap first Open button
    await browserDiscoverPage.tapOpenButton(0)
    await browserDiscoverPage.verifyWebviewLoaded()
    await browserDiscoverPage.verifyUrlLoaded()

    // Navigate back to Discover and tap second Open button
    await browserDiscoverPage.goBackToDiscover()
    await browserDiscoverPage.scrollDiscoverPage()

    await browserDiscoverPage.tapOpenButton(1)
    await browserDiscoverPage.verifyWebviewLoaded()
    await browserDiscoverPage.verifyUrlLoaded()
  })

  it('[Smoke] Should scroll and navigate learn carousel items', async () => {
    await bottomTabsPage.tapBrowserTab()
    await browserDiscoverPage.goBackToDiscover()

    // Scroll down to reach the Learn section
    await browserDiscoverPage.scrollDiscoverPage()
    await browserDiscoverPage.scrollDiscoverPage()
    await browserDiscoverPage.waitForLearnItems()

    // Tap first visible learn item
    await browserDiscoverPage.tapFirstLearnItem()
    await browserDiscoverPage.verifyWebviewLoaded()
    await browserDiscoverPage.verifyUrlLoaded()

    // Navigate back to Discover
    await browserDiscoverPage.goBackToDiscover()

    // Scroll down and scroll the Learn carousel
    await browserDiscoverPage.scrollDiscoverPage()
    await browserDiscoverPage.scrollDiscoverPage()
    await browserDiscoverPage.waitForLearnItems()
    await browserDiscoverPage.scrollLearnCarousel()

    // Tap the next visible learn item
    await browserDiscoverPage.tapFirstLearnItem()
    await browserDiscoverPage.verifyWebviewLoaded()
    await browserDiscoverPage.verifyUrlLoaded()
  })
})
