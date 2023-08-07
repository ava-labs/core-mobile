import { Page } from '@playwright/test'

class CoreAppPage {
  page: Page

  constructor(page: Page) {
    this.page = page
  }

  get coreAppHomepage() {
    return 'https://core.app/'
  }

  get termsCheckBox() {
    return this.page.locator('[data-testid="connect-terms-checkbox"]')
  }

  get continueBtn() {
    return this.page.locator('[data-testid="connect-terms-continue-btn"]')
  }

  get connectWalletBtn() {
    return this.page.locator('[data-testid="connect-wallet-button"]')
  }

  async clickConnectWalletBtn() {
    await this.connectWalletBtn.click()
  }

  async clickAcceptTermsCheckbox() {
    await this.termsCheckBox.click()
  }

  async clickContinueBtn() {
    await this.continueBtn.click()
  }
}

export default CoreAppPage
