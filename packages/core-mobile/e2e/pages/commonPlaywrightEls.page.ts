import { Page } from '@playwright/test'
import commonEls from '../locators/commonPlaywrightEls.loc'
import playwrightActions from '../helpers/playwrightActions'
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

  get wuiQrCodeUri() {
    return this.page.locator(commonEls.wuiQrCode)
  }

  get wcmWalletUri() {
    return this.page.locator(commonEls.wcmUri).first()
  }

  get connectToAWalletBtn() {
    return this.page.getByText('Connect to a wallet')
  }

  async qrUriValue(locator = 'wcm', timeout = 5000) {
    if (locator === 'wcm') {
      await playwrightActions.waitFor(this.wcmWalletUri, timeout)
      return await this.wcmWalletUri.getAttribute('uri')
    } else {
      await playwrightActions.waitFor(this.wuiQrCodeUri, timeout)
      return await this.wuiQrCodeUri.getAttribute('uri')
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

  get walletConnectUri() {
    return this.page.getByText('Copy to clipboard')
  }

  async walletConnectUriValue() {
    await this.walletConnectUri.click()
  }

  async clickConnectToAWalletBtn() {
    await this.connectToAWalletBtn.click()
  }
}

export default CommonElsPage
