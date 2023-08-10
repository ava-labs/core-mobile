import { Page } from '@playwright/test'

class YieldYakPage {
  page: Page

  constructor(page: Page) {
    this.page = page
  }

  get yieldYakHomepage() {
    return 'https://www.yieldyak.com/'
  }

  get showMoreBtn() {
    return this.page.locator('text=Show more')
  }

  get connectWalletBtn() {
    return this.page.locator('text= Connect Wallet ')
  }

  async clickShowMoreBtn() {
    await this.showMoreBtn.click()
  }
}

export default YieldYakPage
