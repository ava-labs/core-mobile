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

  async verifyUrl(url: string) {
    await actions.waitFor(this.browserUrl)
    const urlText = await actions.getText(this.browserUrl)
    assert.equal(urlText, url, `${urlText} not equal to ${url}`)
    console.log('URL text: ', urlText)
  }
}

export default new BrowserPage()
