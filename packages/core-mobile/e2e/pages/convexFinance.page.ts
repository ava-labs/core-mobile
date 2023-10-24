import { Page } from '@playwright/test'

class ConvexFinancePage {
  page: Page

  constructor(page: Page) {
    this.page = page
  }

  get convexFinanceHomepage() {
    return 'https://www.convexfinance.com/'
  }

  get walletConnectV2Btn() {
    return this.page.locator('text=WalletConnect V2')
  }

  async clickWalletConnectV2Btn() {
    await this.walletConnectV2Btn.click()
  }
}

export default ConvexFinancePage
