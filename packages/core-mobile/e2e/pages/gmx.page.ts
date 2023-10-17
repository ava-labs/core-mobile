import { Page } from '@playwright/test'

class GmxPage {
  page: Page

  constructor(page: Page) {
    this.page = page
  }

  get gmxHomepage() {
    return 'https://app.gmx.io/#/dashboard'
  }
}

export default GmxPage
