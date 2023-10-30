import { Page } from '@playwright/test'

class OpenseaPage {
  page: Page

  constructor(page: Page) {
    this.page = page
  }

  get openseaHomepage() {
    return 'https://opensea.io/'
  }
}

export default OpenseaPage
