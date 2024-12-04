import { Page } from '@playwright/test'

class CoreApp {
  page: Page

  constructor(page: Page) {
    this.page = page
  }

  get coreUrl() {
    return 'https://core.app/'
  }

  get termsCheckBox() {
    return this.page.locator('[data-testid="connect-terms-checkbox"]')
  }

  get continueBtn() {
    return this.page.locator('[data-testid="connect-terms-continue-btn"]')
  }

  get connect() {
    return this.page.locator('[data-testid="connect-wallet-button"]')
  }

  get coreMobile() {
    return this.page.locator('[data-testid="connect-core-mobile"]')
  }
}

export default CoreApp
