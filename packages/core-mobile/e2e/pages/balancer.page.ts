import { Page } from '@playwright/test'

class BalancerPage {
  page: Page

  constructor(page: Page) {
    this.page = page
  }

  get balancerHomepage() {
    return 'https://app.balancer.fi/'
  }

  get connectWalletBtn() {
    return this.page.locator('path[stroke="url(#wallet_gradient)"]').first()
  }

  get tosCheckbox() {
    return this.page.locator('input[value="bal-rules"]')
  }

  get walletConnectBtn() {
    return this.page.locator('img[src*="walletconnect"]')
  }

  async clickWalletConnectBtn() {
    await this.walletConnectBtn.click()
  }

  async clickTosCheckbox() {
    await this.tosCheckbox.click()
  }

  async clickConnectWalletBtn() {
    await this.connectWalletBtn.click()
  }
}

export default BalancerPage
