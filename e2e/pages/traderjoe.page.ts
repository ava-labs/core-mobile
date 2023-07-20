import { Page } from '@playwright/test'
import traderJoe from '../locators/traderjoe.loc'

class TraderJoePage {
  page: Page

  constructor(page: Page) {
    this.page = page
  }

  get connectWalletButton() {
    return this.page.getByRole('button', { name: 'Connect Wallet' })
  }

  get oldWalletConnectModal() {
    return this.page.getByRole('button', { name: 'OPEN' })
  }

  get connectWalletButtonText() {
    return this.page.getByText(traderJoe.connectWalletButtonText)
  }

  get walletConnectCode() {
    return this.page.getByText(traderJoe.walletConnectCode)
  }

  get walletConnectButton() {
    return this.page.locator(`[data-testid="rk-wallet-option-walletConnect"]`)
  }

  get metamaskButton() {
    return this.page.getByRole('button', { name: 'MetaMask' })
  }

  get qrUri() {
    return this.page.locator('wcm-qrcode')
  }

  async qrUriValue() {
    return await this.qrUri.getAttribute('uri')
  }

  async clickConnectWalletButton() {
    await this.connectWalletButton.click()
  }

  async clickWalletConnectButton() {
    await this.walletConnectButton.click()
  }

  async clicMetamaskButton() {
    await this.metamaskButton.click()
  }

  async clickOldWalletConnectModal() {
    await this.oldWalletConnectModal.click()
  }

  async clickWalletConnectCode() {
    await this.walletConnectCode.click()
  }

  get homePage() {
    return 'https://traderjoe.xyz/'
  }
}

export default TraderJoePage
