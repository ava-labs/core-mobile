import warmup from '../../helpers/warmup'
import bottomTabsPage from '../../pages/bottomTabs.page'
import browserPage from '../../pages/browser.page'
import browserLoc from '../../locators/browser.loc'

describe('Browser - dApp', () => {
  it('Should verify the injected provider on dapps', async () => {
    await warmup()
    await bottomTabsPage.tapBrowserTab()

    await browserPage.goToUrl(browserLoc.core)
    await browserPage.verifyInjectedDapp()
    await browserPage.verifyUrlContains('core.app')

    await browserPage.goToUrl(browserLoc.aave)
    await browserPage.verifyInjectedDapp()
  })

  it('Should swap on dapp', async () => {
    await bottomTabsPage.tapBrowserTab()
    await browserPage.goToUrl(browserLoc.blackholeSwap)
    await browserPage.verifyInjectedDapp()
    await browserPage.swapBlackhole()
  })
})
