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
      await actions.waitFor(this.androidChromePager)
      await commonElsPage.goAndroidBack()
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
