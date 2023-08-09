import { Page } from '@playwright/test'
import commonEls from '../locators/commonPlaywrightEls.loc'

class CommonElsPage {
  page: Page

  constructor(page: Page) {
    this.page = page
  }

  get connectWalletBtn() {
    return this.page.getByText(commonEls.connectWallet).first()
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

  // Some sites have multiple wallet connect buttons so adjust the index as needed in order to click the correct one
  async clickWalletConnectBtn(index = 0) {
    const walletConnectBtn = this.page.locator(
      `text=WalletConnect >> nth=${index}`
    )
    await walletConnectBtn.click()
  }
}

export default CommonElsPage
