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

  get browserUrlText() {
    return selectors.getById(browserLoc.browserUrlText)
  }

  get discoverTitle() {
    return selectors.getById(browserLoc.discoverTitle)
  }

  get searchBar() {
    return selectors.getById(browserLoc.searchBar)
  }

  get closeTabBtn() {
    return selectors.getById(browserLoc.closeTabBtn)
  }

  get blackholeAmountInput() {
    return selectors.getByXpath(
      driver.isAndroid
        ? '//android.widget.EditText[1]'
        : browserLoc.blackholeAmountInput
    )
  }

  get blackholeSwapTitle() {
    return driver.isAndroid
      ? selectors.getBySomeText(browserLoc.blackholeSwapTitle)
      : selectors.getById(browserLoc.blackholeSwapTitle)
  }

  get blackholeSwapButton() {
    return driver.isAndroid
      ? selectors.getBySomeText(browserLoc.blackholeSwapButton)
      : selectors.getById(browserLoc.blackholeSwapButton)
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

  get blazeEcosystemCarouselItem() {
    return selectors.getById(browserLoc.blazeEcosystemCarouselItem)
  }

  get learnCarouselItem0() {
    return selectors.getById(browserLoc.learnCarouselItem0)
  }

  get suggestedItem0() {
    return selectors.getById(browserLoc.suggestedItem0)
  }

  get trendingProjectsTitle() {
    return selectors.getById(browserLoc.trendingProjectsTitle)
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
    return selectors.getById(browserLoc.openTrendingProjectBtn)
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
    const uiUrl = await this.getDisplayedUrl()
    assert.equal(uiUrl, expected, `"${uiUrl}" !== "${expected}"`)
    console.log('URL text: ', uiUrl)
  }

  async verifyInjectedDapp() {
    await actions.waitFor(this.myWebview, 30000)
    if (driver.isIOS) {
      // Web content (0x address, Connect button) is accessible via XCUITest
      // but not via UiAutomator2 native accessibility tree on Android
      await actions.waitFor(selectors.getBySomeText('0x'))
      await actions.isNotVisible(selectors.getByText('Connect'))
    }
  }

  async tapClose() {
    if (driver.isIOS) {
      await actions.tap(this.close)
    } else {
      try {
        await actions.waitFor(this.androidChromePager)
      } catch (e) {
        console.log('a different webview is displayed')
      }
      await commonElsPage.goAndroidBack()
    }
  }

  async verifyUrlContains(substring: string) {
    const uiUrl = await this.getDisplayedUrl()
    assert.ok(
      uiUrl.includes(substring),
      `URL "${uiUrl}" does not contain "${substring}"`
    )
    console.log('URL text: ', uiUrl)
  }

  async verifyUrlLoaded() {
    const uiUrl = await this.getDisplayedUrl()
    assert.ok(
      uiUrl.startsWith('https://'),
      `Expected a loaded URL, got: "${uiUrl}"`
    )
    console.log('URL text: ', uiUrl)
  }

  private async getDisplayedUrl(): Promise<string> {
    if (driver.isAndroid) {
      // UiAutomator2 slows down while WebView renders (including cookie dialogs).
      // Wait for WebView to fully settle before querying native elements.
      await actions.delay(8000)
    }
    await actions.waitFor(this.browserUrlText)
    return actions.getText(this.browserUrlText)
  }

  async removeAllTabs() {
    await this.tapTabsBtn()
    await actions.waitFor(this.closeTabBtn)
    while (await actions.getVisible(this.closeTabBtn)) {
      await this.tapTabItemCloseBtn()
      await actions.delay(1000)
    }
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

  async tapBlazeEcosystemCarouselItem(maxSwipes = 15) {
    await actions.waitFor(this.discoverTitle)
    for (let i = 0; i < maxSwipes; i++) {
      if (await actions.getVisible(this.blazeEcosystemCarouselItem)) {
        await actions.tap(this.blazeEcosystemCarouselItem)
        return
      }
      await this.swipeCarouselLeft()
      await actions.delay(500)
    }
    throw new Error('blazeEcosystemCarouselItem not found after scrolling')
  }

  private async swipeCarouselLeft(): Promise<void> {
    const { width, height } = await driver.getWindowSize()
    await driver.performActions([
      {
        type: 'pointer',
        id: 'finger1',
        parameters: { pointerType: 'touch' },
        actions: [
          {
            type: 'pointerMove',
            duration: 0,
            x: Math.round(width * 0.8),
            y: Math.round(height * 0.4)
          },
          { type: 'pointerDown', button: 0 },
          { type: 'pause', duration: 100 },
          {
            type: 'pointerMove',
            duration: 300,
            x: Math.round(width * 0.2),
            y: Math.round(height * 0.4)
          },
          { type: 'pointerUp', button: 0 }
        ]
      }
    ])
  }

  async tapFirstLearnItem() {
    await actions.dragAndDrop(this.trendingProjectsTitle, [0, -1500])
    await actions.tap(this.learnCarouselItem0)
  }

  async tapFirstSuggestedItem() {
    await actions.tap(this.suggestedItem0)
  }

  async tapTrendingProjectOpenBtn() {
    await actions.dragAndDrop(this.trendingProjectsTitle, [0, -1000])
    const items = ['Core web', 'Off The Grid', 'yellow ket']
    for (const item of items) {
      const button = selectors.getById(`trending_project_open_btn__${item}`)
      if (await actions.getVisible(button)) {
        await actions.tap(button)
        return
      }
    }
    throw new Error('trending project not found')
  }

  async openNewTabViaMenu() {
    await this.tapUrlMenuTrigger()
    await actions.tap(selectors.getByText(browserLoc.openNewTab))
    await actions.delay(1000)
  }

  async tapCloseAllTabsMenu() {
    await actions.tap(this.closeAllTabsMenu)
    await commonElsPage.tapYesAlert()
  }

  async tapBrowsingHistoryMenu() {
    await actions.tap(this.browsingHistoryMenu)
  }

  async tapClearAllHistory() {
    await actions.tap(this.clearAllHistoryBtn)
    await commonElsPage.tapYesAlert()
  }

  async verifyNoHistory() {
    await actions.waitFor(this.noHistory)
  }

  async verifyBrowserDiscoveryScreen() {
    await actions.waitFor(this.searchBar)
    await actions.waitFor(this.discoverTitle)
  }

  async verifyHistoryScreen() {
    await actions.waitFor(this.historyTitle)
    await actions.isVisible(this.browserHistoryItem)
    await actions.isVisible(this.searchBar)
  }
}

export default new BrowserPage()
