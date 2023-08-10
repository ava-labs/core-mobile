import { Page } from '@playwright/test'

class StakeLidoPage {
  page: Page

  constructor(page: Page) {
    this.page = page
  }

  get stakeLidoHomepage() {
    return 'https://stake.lido.fi/'
  }

  get tosCheckbox() {
    return this.page.locator(
      'text=I certify that I have read and accept the updated'
    )
  }

  async clickTosCheckbox() {
    await this.tosCheckbox.click()
  }
}

export default StakeLidoPage
