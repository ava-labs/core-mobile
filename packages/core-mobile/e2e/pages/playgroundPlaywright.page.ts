import { Page } from '@playwright/test'
import actions from '../helpers/playwrightActions'
import delay from '../helpers/waits'
import CommonElsPage from './commonPlaywrightEls.page'

class PlaygroundPlaywrightPage {
  page: Page

  constructor(page: Page) {
    this.page = page
  }

  get url() {
    return 'https://ava-labs.github.io/extension-avalanche-playground/'
  }

  get rpcCalls() {
    return this.page.locator('text="RPC Calls"')
  }

  get response() {
    return this.page.locator(
      "//button[normalize-space()='Send']/following-sibling::h1"
    )
  }

  async sendRpcCall(rpcCall: string) {
    await actions.open(this.url, this.page)
    await this.tapRpcCalls()
    await this.selectMethod(rpcCall)
    await this.tapSend()
    await delay(5000)
  }

  async connect() {
    const common = new CommonElsPage(this.page)
    await actions.open(this.url, this.page)
    await this.tapWagmi()
    await common.tapWalletConnect()
    const qrUri = await common.qrUriValue('wui')
    if (qrUri) {
      await actions.writeQrCodeToFile(qrUri)
    }
    console.log(qrUri)
    await actions.waitFor(this.rpcCalls, 30000)
    await delay(1000)
  }

  async tapWagmi() {
    await this.page.locator('text="Connect via Wallet Connect - Wagmi"').click()
  }

  async tapRpcCalls() {
    await this.rpcCalls.click()
  }

  async tapMethodsDropdown() {
    await this.page.locator('[data-testid="ArrowDropDownIcon"]').click()
  }

  async selectMethod(rpcCall: string) {
    await this.tapMethodsDropdown()
    const dropdownOption = `//li[contains(@id, "option")]/span[text()="${rpcCall}"]`
    await this.page.locator(dropdownOption).click()
  }

  async tapSend() {
    await this.page.locator('text="Send"').click()
  }
}

export default PlaygroundPlaywrightPage
