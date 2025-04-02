import { Page } from '@playwright/test'
import commonEls from '../locators/commonPlaywrightEls.loc'
import actions from '../helpers/playwrightActions'

class CommonElsPage {
  page: Page

  constructor(page: Page) {
    this.page = page
  }

  get connectWalletBtn() {
    return this.page.getByText(commonEls.connectWallet).first()
  }

  get connectwalletBtn() {
    return this.page.getByText(commonEls.connectwallet).first()
  }

  get walletConnectBtn() {
    return this.page.getByText(commonEls.walletConnectBtn)
  }

  get walletConnectV2Btn() {
    return this.page.locator('text="WalletConnect V2"')
  }

  get wuiQrCodeUri() {
    return this.page.locator(commonEls.wuiQrCode)
  }

  get w3mQrCodeUri() {
    return this.page.locator(commonEls.w3mQrCode)
  }

  get wcmQrCode() {
    return this.page.locator(commonEls.wcmQrCode).first()
  }

  get connectToAWalletBtn() {
    return this.page.locator('text="Connect to a wallet"')
  }

  get open() {
    return this.page.locator('text="OPEN"')
  }

  async qrUriValue(locator = 'wcm', timeout = 5000) {
    if (locator === 'wcm') {
      await actions.waitFor(this.wcmQrCode, timeout)
      return await this.wcmQrCode.getAttribute('uri')
    } else if (locator === 'w3m') {
      await actions.waitFor(this.w3mQrCodeUri, timeout)
      return await this.w3mQrCodeUri.getAttribute('uri')
    } else {
      await actions.waitFor(this.wuiQrCodeUri, timeout)
      return await this.wuiQrCodeUri.getAttribute('uri')
    }
  }

  async waitForQrUriNotVisible(locator = this.wcmQrCode) {
    await actions.waitFor(locator, 30000, false)
  }

  async tapConnectWallet(index = 0) {
    const connectWallet = this.page.locator(
      `text=/connect wallet/i >> nth=${index}`
    )
    await actions.waitFor(connectWallet)
    await connectWallet.click()
  }

  // Some sites have multiple wallet connect buttons so adjust the index as needed in order to click the correct one
  async tapWalletConnect(index = 0) {
    const walletConnectBtn = this.page.locator(
      `text="WalletConnect" >> nth=${index}`
    )
    await actions.waitFor(walletConnectBtn)
    await walletConnectBtn.click()
  }

  async tapWallet_Connect() {
    await actions.waitFor(this.page.locator('text="Wallet Connect"'))
    await this.page.locator('text="Wallet Connect"').click()
  }

  async tapCopy() {
    return actions.tap(this.page.getByText('Copy'))
  }

  async tapWalletConnectV2() {
    await actions.waitFor(this.walletConnectV2Btn)
    await actions.tap(this.walletConnectV2Btn)
  }

  async tapOpen() {
    await actions.tap(this.open, 20000)
  }

  async tapConnectToAWallet(index = 0) {
    await this.connectToAWalletBtn.nth(index).click()
  }
}

export default CommonElsPage
