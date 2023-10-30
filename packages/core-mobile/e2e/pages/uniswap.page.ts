import { Page } from '@playwright/test'

class UniswapPage {
  page: Page

  constructor(page: Page) {
    this.page = page
  }

  get connectWalletBtn() {
    return this.page.locator('[data-testid="navbar-connect-wallet"]')
  }

  async clickConnectBtn() {
    await this.connectWalletBtn.click()
  }

  get uniswapHomePage() {
    return 'https://app.uniswap.org/#/swap'
  }
}

export default UniswapPage
