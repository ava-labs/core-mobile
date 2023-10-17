import { Page } from '@playwright/test'
class TraderJoePage {
  page: Page

  constructor(page: Page) {
    this.page = page
  }

  get oldWalletConnectModal() {
    return this.page.getByRole('button', { name: 'OPEN' })
  }

  get metamaskButton() {
    return this.page.getByRole('button', { name: 'MetaMask' })
  }

  async clickOldWalletConnectModal() {
    await this.oldWalletConnectModal.click()
  }

  get homePage() {
    return 'https://traderjoe.xyz/'
  }
}

export default TraderJoePage
