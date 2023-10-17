import { Page } from '@playwright/test'

class BenqiPage {
  page: Page

  constructor(page: Page) {
    this.page = page
  }

  get benqiHomepage() {
    return 'https://staking.benqi.fi/'
  }
}

export default BenqiPage
