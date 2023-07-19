import { Page } from '@playwright/test'
import uniswapLoc from '../locators/uniswap.loc'

class UniswapPage {
  page: Page

  constructor(page: Page) {
    this.page = page
  }

  get connectWalletBtn() {
    return this.page.locator('[data-testid="navbar-connect-wallet"]')
  }

  get walletConnectBtn() {
    return this.page.getByText(uniswapLoc.walletConnect)
  }

  get copyBtn() {
    return this.page.locator(`[class="wcm-action-btn"] > svg`)
  }

  get qrCode() {
    return this.page.locator('wcm-qrcode')
  }

  async qrCodeUri() {
    return await this.qrCode.getAttribute('uri')
  }

  async clickConnectBtn() {
    await this.connectWalletBtn.click()
  }

  async clickWalletConnectBtn() {
    await this.walletConnectBtn.click()
  }

  async clickCopyBtn() {
    await this.copyBtn.click()
  }

  get uniswapHomePage() {
    return 'https://app.uniswap.org/#/swap'
  }
}

export default UniswapPage
