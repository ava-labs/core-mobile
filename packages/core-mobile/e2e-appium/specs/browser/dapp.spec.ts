import warmup from '../../helpers/warmup'
import bottomTabsPage from '../../pages/bottomTabs.page'
import browserPage from '../../pages/browser.page'
import browserLoc from '../../locators/browser.loc'

describe('Browser - dApp', () => {
  it('Should expose connected Core EVM account on core.app, Aave, and BENQI', async () => {
    await warmup()
    await bottomTabsPage.tapBrowserTab()

    await browserPage.goToUrl(browserLoc.core)
    await browserPage.verifyInjectedDapp()
    await browserPage.verifyUrl(browserLoc.injectedCore)

    await browserPage.goToUrl(browserLoc.aave)
    await browserPage.verifyInjectedDapp()
  })

  it('Should initiate a swap from each dApp and reach native transaction approval', async () => {
    await bottomTabsPage.tapBrowserTab()
    await browserPage.goToUrl(browserLoc.blackholeSwap)
    await browserPage.verifyInjectedDapp()
    await browserPage.swapBlackhole()
  })
})
