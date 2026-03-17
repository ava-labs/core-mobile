import assert from 'assert'
import { actions } from '../helpers/actions'
import { selectors } from '../helpers/selectors'
import browserLoc from '../locators/browser.loc'
import commonElsPage from './commonEls.page'

class BrowserPage {
  get topBrowserBar() {
    return selectors.getById(browserLoc.topBrowserBar)
  }

  get close() {
    return selectors.getById(browserLoc.close)
  }

  get androidChromePager() {
    return selectors.getById(browserLoc.androidChromePager)
  }

  get browserUrl() {
    return selectors.getById(browserLoc.browserUrl)
  }

  get tabsButton() {
    return selectors.getById(browserLoc.tabsButton)
  }

  get tabsMenuTrigger() {
    return selectors.getById(browserLoc.tabsMenuTrigger)
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

  async tapTabsButton() {
    // Use content-desc to avoid tapping the URL/search bar (which has similar bounds).
    // Tap near top-left corner to ensure we hit the tabs button, not overlapping URL bar.
    const tabsButton = driver.isIOS
      ? selectors.getByText('Open tabs panel')
      : selectors.getByXpath(
          "//*[@resource-id='browser_tabs_button' or @content-desc='Open tabs panel']"
        )
    await actions.tapTopLeft(tabsButton)
  }

  async tapTabsMenuTrigger() {
    await actions.tap(this.tabsMenuTrigger)
  }

  async tapAddTab() {
    await actions.tap(selectors.getById(browserLoc.tabsAddTab))
  }

  async tapBrowsingHistory() {
    await actions.tap(selectors.getByText('Browsing history'))
  }

  async tapCloseAllTabs() {
    await actions.tap(selectors.getByText('Close all tabs'))
  }

  async tapCloseAllTabsConfirm() {
    // Android displays "YES" (uppercase); use getBySmartText to match both
    await actions.tap(selectors.getBySmartText('Yes'))
  }

  async tapUrlBar() {
    const urlBar = selectors.getBySmartText('Search or type URL')
    await actions.waitFor(urlBar)
    await actions.tap(urlBar)
  }

  async typeUrl(url: string) {
    await actions.delay(500)
    await actions.typeIntoFocusedElement(url)
  }

  async submitUrl() {
    await actions.tapEnterOnKeyboard()
  }

  async verifyDiscoverVisible() {
    const discoverEl = selectors.getBySomeText('Discover')
    await actions.waitFor(discoverEl)
    await actions.isVisible(discoverEl)
  }

  async verifyTabsPanelVisible() {
    const tabsEl = selectors.getBySomeText('tab')
    await actions.waitFor(tabsEl)
    await actions.isVisible(tabsEl)
  }

  async verifyHistoryScreenVisible() {
    const emptyStateEl = selectors.getByText('You have no History')
    await actions.waitFor(emptyStateEl)
    await actions.isVisible(emptyStateEl)
  }

  async verifyHistoryEmptyMessage() {
    await actions.waitFor(selectors.getByText('You have no History'))
    await actions.isVisible(selectors.getByText('You have no History'))
  }

  async verifyHistoryContainsText(text: string) {
    await actions.waitFor(selectors.getBySomeText(text))
    await actions.isVisible(selectors.getBySomeText(text))
  }

  async verifyUrlContains(text: string) {
    await actions.waitFor(this.browserUrl)
    const urlText = await actions.getText(this.browserUrl)
    assert.ok(
      urlText.includes(text),
      `Expected URL to contain "${text}" but got "${urlText}"`
    )
  }

  async verifyUrl(url: string) {
    await actions.waitFor(this.browserUrl)
    const urlText = await actions.getText(this.browserUrl)
    assert.equal(urlText, url, `${urlText} not equal to ${url}`)
    console.log('URL text: ', urlText)
  }
}

export default new BrowserPage()
