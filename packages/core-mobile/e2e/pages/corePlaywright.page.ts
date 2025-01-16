import { Page } from '@playwright/test'
import actions from '../helpers/playwrightActions'
import delay from '../helpers/waits'
import CommonElsPage from './commonPlaywrightEls.page'

class CorePlaywrightPage {
  page: Page

  constructor(page: Page) {
    this.page = page
  }

  get coreUrl() {
    return 'https://core.app/'
  }

  get coreTransferUrl() {
    return 'https://core.app/stake/cross-chain-transfer/'
  }

  get coreTestnetTransferUrl() {
    return 'https://test.core.app/stake/cross-chain-transfer/'
  }

  get coreTestnetUrl() {
    return 'https://test.core.app/'
  }

  get coreDelegateUrl() {
    return 'https://test.core.app/stake/delegate/'
  }

  get termsCheckBox() {
    return this.page.locator('[data-testid="connect-terms-checkbox"]')
  }

  get continueBtn() {
    return this.page.locator('[data-testid="connect-terms-continue-btn"]')
  }

  get connectBtn() {
    return this.page.locator('[data-testid="connect-wallet-button"]')
  }

  get coreMobile() {
    return this.page.locator('[data-testid="connect-core-mobile"]')
  }

  get allNetworks() {
    return this.page.locator('text="All Networks"')
  }

  get availableAmountToTransfer() {
    return this.page.locator('text="Available Balance: -- AVAX"')
  }

  get transferSpinnerSvg() {
    return this.page.locator(
      'div[data-testid="crosschain-transfer-amount"] svg[role="progressbar"]'
    )
  }

  get transferInputField() {
    return this.page.locator(
      'div[data-testid="crosschain-transfer-amount"] input'
    )
  }

  get exportBtn() {
    return this.page.locator(
      'button[data-testid="crosschain-confirm-transfer-export-btn"]'
    )
  }

  get importBtn() {
    return this.page.locator(
      'button[data-testid="crosschain-confirm-transfer-import-btn"]'
    )
  }

  get fromNetworkSvg() {
    return this.page
      .locator('div[data-testid="crosschain-select-src"] svg')
      .first()
  }

  get toNetworkSvg() {
    return this.page
      .locator('div[data-testid="crosschain-select-dst"] svg')
      .first()
  }

  get acceptBtn() {
    return this.page.locator('text="Accept"')
  }

  get getStartedBtn() {
    return this.page.locator('button[data-testid="stake-get-started-btn"]')
  }

  get stakeAmountInputField() {
    return this.page.locator('input[id="stake-amount-input"]')
  }

  get nextBtn() {
    return this.page.locator('button[data-testid="stake-next-btn"]')
  }

  get chooseDurationPageTitle() {
    return this.page.locator('text="Choose Staking Duration"')
  }

  get chooseRewardPageTitle() {
    return this.page.locator('text="Choose Rewards Address"')
  }

  get summaryPageTitle() {
    return this.page.locator('text="Summary"')
  }

  get submitBtn() {
    return this.page.locator(
      'button[data-testid="stake-submit-delegation-btn"]'
    )
  }

  get selectNodeSpan() {
    return this.page
      .locator('span[data-testid="stake-node-row-select-btn"]')
      .first()
  }

  async connect(isTesnet = false) {
    const url = isTesnet ? this.coreTestnetUrl : this.coreUrl
    const common = new CommonElsPage(this.page)
    await actions.open(url, this.page)
    await actions.tap(this.acceptBtn)
    await actions.tap(this.connectBtn, 10000)
    await actions.tap(this.coreMobile)
    await actions.tap(this.termsCheckBox)
    await actions.tap(this.continueBtn)
    await actions.tap(common.walletConnectBtn)
    const qrUri = await common.qrUriValue('wui')
    console.log('URI: ', qrUri)
    if (qrUri) {
      await actions.writeQrCodeToFile(qrUri)
    }
    await actions.waitFor(this.allNetworks, 30000)
    await delay(1000)
  }

  // eslint-disable-next-line max-params
  async transfer(from: string, to: string, isTesnet = false, amount = '0.001') {
    const url = isTesnet ? this.coreTestnetTransferUrl : this.coreTransferUrl
    await actions.open(url, this.page)
    await this.isReadyToTransfer()
    await this.tapFromNetworkSvg()
    await this.selectNetwork(from)
    await this.tapToNetworkSvg()
    await this.selectNetwork(to)
    await this.isReadyToTransfer()
    await this.enterTransferAmount(amount)
    await this.isReadyToTransfer()
    await this.tapExport()
    await this.tapImport()
    await delay(10000)
  }

  async delegate() {
    await actions.open(this.coreDelegateUrl, this.page)
    await actions.tap(this.getStartedBtn, 30000)
    // Enter amount
    await actions.waitFor(this.stakeAmountInputField, 30000)
    await this.stakeAmountInputField.fill('1')
    await actions.tap(this.nextBtn)
    // Select node
    await actions.tap(this.selectNodeSpan)
    await actions.tap(this.nextBtn)
    // Select duration (default 1 day)
    await actions.waitFor(this.chooseDurationPageTitle)
    await actions.tap(this.nextBtn)
    // Select reward address
    await actions.waitFor(this.chooseRewardPageTitle)
    await actions.tap(this.nextBtn)
    // Submit
    await actions.waitFor(this.summaryPageTitle)
    await actions.tap(this.submitBtn)
    await delay(8000)
  }

  async enterTransferAmount(amount: string) {
    await this.transferInputField.fill(amount)
  }

  async tapExport() {
    await actions.waitForEnabled(this.exportBtn, 30000)
    await actions.tap(this.exportBtn)
  }

  async tapImport() {
    await actions.waitForEnabled(this.importBtn, 30000)
    await actions.tap(this.importBtn)
  }

  async tapFromNetworkSvg() {
    // await actions.waitFor(this.page.locator('h1:has-text("Cross-Chain Transfer")'), 30000)
    await actions.waitForEnabled(this.fromNetworkSvg, 30000)
    await actions.tap(this.fromNetworkSvg)
  }

  async tapToNetworkSvg() {
    await actions.waitForEnabled(this.toNetworkSvg, 30000)
    await actions.tap(this.toNetworkSvg, 30000)
  }

  async selectNetwork(network = 'P') {
    await actions.tap(this.page.locator(`li[data-value=${network}]`))
  }

  async isReadyToTransfer() {
    try {
      await actions.waitFor(this.availableAmountToTransfer, 30000, false)
      await actions.waitFor(this.transferSpinnerSvg, 30000, false)
      return true
    } catch (e) {
      console.log('The wallet is not loading the amount to transfer')
      return false
    }
  }
}

export default CorePlaywrightPage
