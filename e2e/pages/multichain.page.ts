import { Page } from '@playwright/test'

class MultichainPage {
  page: Page

  constructor(page: Page) {
    this.page = page
  }

  get multichainHomepage() {
    return 'https://app.multichain.org/#/router'
  }
}

export default MultichainPage
