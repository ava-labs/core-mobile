import { Page } from '@playwright/test'

class CompoundFinancePage {
  page: Page

  constructor(page: Page) {
    this.page = page
  }

  get compoundFinanceHomepage() {
    return 'https://app.compound.finance/'
  }
}

export default CompoundFinancePage
