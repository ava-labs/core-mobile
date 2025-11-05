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

  async tapClose() {
    if (driver.isIOS) {
      await actions.tap(this.close)
    } else {
      await actions.waitFor(this.androidChromePager)
      await commonElsPage.goAndroidBack()
    }
  }
}

export default new BrowserPage()
