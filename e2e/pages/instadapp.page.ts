import { Page } from '@playwright/test'
import delay from '../helpers/waits'

class InstadappPage {
  page: Page

  constructor(page: Page) {
    this.page = page
  }

  get instadappHomepage() {
    return 'https:/defi.instadapp.io/'
  }

  get connectBtn() {
    return this.page.locator('text=Connect >> visible=true')
  }

  get walletConnectV2Btn() {
    return this.page.locator('text=WalletConnect v2')
  }

  // async clickConnectBtn(index = 0) {
  //   const connectBtn = this.page.locator(`text=Connect >> nth=${index}`)
  //   await connectBtn.click()
  // }

  async clickConnectBtn() {
    await delay(2000)
    await this.connectBtn.click()
  }

  async clickWalletConnectV2Btn() {
    await this.walletConnectV2Btn.click()
  }
}

export default InstadappPage
