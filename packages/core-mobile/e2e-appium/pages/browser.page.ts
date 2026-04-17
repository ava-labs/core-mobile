import assert from 'assert'
import { actions } from '../helpers/actions'
import { selectors } from '../helpers/selectors'
import browserLoc from '../locators/browser.loc'
import txPage from './transactions.page'
import commonElsPage from './commonEls.page'

class BrowserPage {
  get myWebview() {
    return selectors.getById(browserLoc.myWebview)
  }

  get androidChromePager() {
    return selectors.getById(browserLoc.androidChromePager)
  }

  get close() {
    return selectors.getById(browserLoc.close)
  }

  get searchBar() {
    return selectors.getById(browserLoc.searchBar)
  }

  get closeTabBtn() {
    return selectors.getById(browserLoc.closeTabBtn)
  }

  get blackholeAmountInput() {
    return selectors.getByXpath(browserLoc.blackholeAmountInput)
  }

  get blackholeSwapTitle() {
    return selectors.getById(browserLoc.blackholeSwapTitle)
  }

  get blackholeSwapButton() {
    return selectors.getById(browserLoc.blackholeSwapButton)
  }

  get tabsBtn() {
    return selectors.getById(browserLoc.tabsBtn)
  }

  get tabsAddBtn() {
    return selectors.getById(browserLoc.tabsAddBtn)
  }

  get tabsMoreBtn() {
    return selectors.getById(browserLoc.tabsMoreBtn)
  }

  get urlMenuTrigger() {
    return selectors.getById(browserLoc.urlMenuTrigger)
  }

  get ecosystemCarouselItem0() {
    return selectors.getById(browserLoc.ecosystemCarouselItem0)
  }

  get learnCarouselItem0() {
    return selectors.getById(browserLoc.learnCarouselItem0)
  }

  get suggestedItem0() {
    return selectors.getById(browserLoc.suggestedItem0)
  }

  get clearAllHistoryBtn() {
    return selectors.getById(browserLoc.clearAll)
  }

  get browsingHistoryMenu() {
    return selectors.getByText(browserLoc.browsingHistoryMenu)
  }

  get closeAllTabsMenu() {
    return selectors.getByText(browserLoc.closeAllTabsMenu)
  }

  get noHistory() {
    return selectors.getByText(browserLoc.noHistory)
  }

  get historyTitle() {
    return selectors.getByText(browserLoc.historyTitle)
  }

  get browserHistoryItem() {
    return selectors.getById(browserLoc.browserHistoryItem)
  }

  get openTrendingProjectBtn() {
    return selectors.getByText(browserLoc.openTrendingProjectBtn)
  }

  async goToUrl(url: string) {
    await actions.waitFor(this.searchBar, 30000)
    await actions.tap(this.searchBar)
    await actions.type(this.searchBar, url)
    await actions.tapEnterOnKeyboard('Go')
    await actions.delay(4000)
  }

  async swapBlackhole() {
    await actions.pasteText(this.blackholeAmountInput, '0.001', 'selected')
    await actions.swipe('up', 0.5, this.blackholeSwapTitle)
    await actions.tap(this.blackholeSwapButton, txPage.approveTitle)
    await txPage.tapApprove()
    await actions.delay(4000)
  }

  async verifyUrl(expected: string) {
    await actions.waitFor(this.searchBar)
    const uiUrl = await actions.getText(this.searchBar)
    assert.equal(uiUrl, expected, `"${uiUrl}" !== "${expected}"`)
    console.log('URL text: ', uiUrl)
  }

  async verifyInjectedDapp() {
    await actions.waitFor(this.myWebview, 30000)
    await actions.waitFor(selectors.getBySomeText('0x'))
    await actions.isNotVisible(selectors.getByText('Connect'))
  }

  async tapClose() {
    if (driver.isIOS) {
      await actions.tap(this.close)
    } else {
      try {
        await driver.switchContext('NATIVE_APP')
      } catch {
        /* already in native context */
      }
      try {
        const menuTrigger = selectors.getById('browser_url_menu_trigger')
        await actions.waitFor(menuTrigger, 5000)
        await actions.tap(menuTrigger)
        const backBtn = selectors.getByText('Back')
        await actions.waitFor(backBtn, 5000)
        await actions.tap(backBtn)
      } catch {
        await commonElsPage.goAndroidBack()
        await actions.delay(500)
        await commonElsPage.goAndroidBack()
      }
      await actions.delay(1000)
    }
  }

  async verifyUrlContains(substring: string) {
    await actions.waitFor(this.searchBar)
    const uiUrl = await actions.getText(this.searchBar)
    assert.ok(
      uiUrl.includes(substring),
      `URL "${uiUrl}" does not contain "${substring}"`
    )
    console.log('URL text: ', uiUrl)
  }

  async verifyUrlLoaded() {
    await actions.waitFor(this.searchBar)
    const uiUrl = await actions.getText(this.searchBar)
    assert.ok(
      uiUrl.startsWith('https://'),
      `Expected a loaded URL, got: "${uiUrl}"`
    )
    console.log('URL text: ', uiUrl)
  }

  async removeAllTabs() {
    await this.tapTabsBtn()
    while (await actions.getVisible(this.closeTabBtn)) {
      await this.tapTabItemCloseBtn()
      await actions.delay(1000)
    }
    await this.verifyBrowserDiscoveryScreen()
  }

  async tapTabsBtn() {
    await actions.tap(this.tabsBtn)
  }

  async tapTabsAddBtn() {
    await actions.tap(this.tabsAddBtn)
  }

  async tapTabsMoreBtn() {
    await actions.tap(this.tabsMoreBtn)
  }

  async tapUrlMenuTrigger() {
    await actions.tap(this.urlMenuTrigger)
  }

  async tapTabItemCloseBtn() {
    await actions.tap(this.closeTabBtn)
  }

  async tapFirstEcosystemCarouselItem() {
    await actions.tap(this.ecosystemCarouselItem0)
  }

  async tapFirstLearnItem() {
    await actions.dragAndDrop(this.ecosystemCarouselItem0, [0, -300])
    await actions.tap(this.learnCarouselItem0)
  }

  async tapFirstSuggestedItem() {
    await actions.tap(this.suggestedItem0)
  }

  async tapFirstTrendingProjectOpenBtn() {
    await actions.tap(this.openTrendingProjectBtn)
  }

  async openNewTabViaMenu() {
    await this.tapUrlMenuTrigger()
    await actions.tap(selectors.getByText(browserLoc.openNewTab))
    await actions.delay(1000)
  }

  async tapCloseAllTabsMenu() {
    await actions.tap(this.closeAllTabsMenu)
  }

  async tapBrowsingHistoryMenu() {
    await actions.tap(this.browsingHistoryMenu)
  }

  async tapClearAllHistory() {
    await actions.tap(this.clearAllHistoryBtn)
  }

  async verifyNoHistory() {
    await actions.waitFor(this.noHistory)
  }

  async verifyBrowserDiscoveryScreen() {
    await actions.waitFor(this.searchBar)
    await actions.waitFor(this.ecosystemCarouselItem0)
  }

  async verifyHistoryScreen() {
    await actions.waitFor(this.historyTitle)
    await actions.isVisible(this.browserHistoryItem)
    await actions.isVisible(this.searchBar)
  }
}

export default new BrowserPage()
