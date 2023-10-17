import { Page } from '@playwright/test'

class OasisPage {
  page: Page

  constructor(page: Page) {
    this.page = page
  }

  get oasisHomepage() {
    return 'https://www.oasis.app'
  }
}

export default OasisPage
