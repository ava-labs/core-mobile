import { Page } from '@playwright/test'

class AavePage {
  page: Page

  constructor(page: Page) {
    this.page = page
  }

  get aaveHomepage() {
    return 'https://app.aave.com/'
  }
}

export default AavePage
