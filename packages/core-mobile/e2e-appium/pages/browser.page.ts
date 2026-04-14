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

  get blackholeAmountInput() {
    return selectors.getByXpath(browserLoc.blackholeAmountInput)
  }

  get blackholeSwapTitle() {
    return selectors.getById(browserLoc.blackholeSwapTitle)
  }

  get blackholeSwapButton() {
    return selectors.getById(browserLoc.blackholeSwapButton)
  }

  async goToUrl(url: string) {
    await actions.waitFor(this.searchBar, 30000)
    await actions.tap(this.searchBar)
    await actions.type(this.searchBar, url)
    await actions.tapEnterOnKeyboard('Go')
    await actions.delay(4000)
  }

  async swapBlackhole() {
    await actions.pasteText(this.blackholeAmountInput, '0.001')
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
}

export default new BrowserPage()
