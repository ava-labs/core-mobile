import { Page } from '@playwright/test'
import commonEls from '../locators/commonPlaywrightEls.loc'

class CommonElsPage {
  page: Page

  constructor(page: Page) {
    this.page = page
  }

  get connectWalletBtn() {
    return this.page.getByText(commonEls.connectWallet)
  }

  get walletConnectBtn() {
    return this.page.getByText(commonEls.walletConnectBtn).first()
  }

  get w3mWalletUri() {
    return this.page.locator(commonEls.w3mUri)
  }

  get wcmWalletUri() {
    return this.page.locator(commonEls.wcmUri)
  }

  async qrUriValue(locator = 'wcm') {
    if (locator === 'wcm') {
      return await this.wcmWalletUri.getAttribute('uri')
    } else {
      return await this.w3mWalletUri.getAttribute('uri')
    }
  }

  async clickConnectWalletBtn() {
    await this.connectWalletBtn.click()
  }

  async clickWalletConnectBtn() {
    await this.walletConnectBtn.click()
  }
}

export default CommonElsPage
