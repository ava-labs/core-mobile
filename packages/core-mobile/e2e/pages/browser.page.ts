import Actions from '../helpers/actions'
import BrowserLoc from '../locators/browser.loc'
import Wbs, { WebScripts } from '../helpers/web'
import delay from '../helpers/waits'
import bottomTabsPage from './bottomTabs.page'
import connectToSitePage from './connectToSite.page'
import plusMenuPage from './plusMenu.page'
import popUpModalPage from './popUpModal.page'
import stakePage from './Stake/stake.page'
import commonElsPage from './commonEls.page'

class BrowserPage {
  get searchBar() {
    return by.id(BrowserLoc.searchBar)
  }

  get browserBackBtn() {
    return by.id(BrowserLoc.browserBackBtn)
  }

  get browserRefreshBtn() {
    return by.id(BrowserLoc.browserRefreshBtn)
  }

  get continueBtn() {
    return by.text(BrowserLoc.continueBtn)
  }

  get suggested() {
    return by.text(BrowserLoc.suggested)
  }

  async tapSearchBar() {
    await Actions.waitForElement(this.searchBar)
    await Actions.tapElementAtIndex(this.searchBar, 0)
  }

  async setUrl(query: string) {
    await this.tapSearchBar()
    await Actions.setInputText(this.searchBar, query)
    await element(this.searchBar).tapReturnKey()
  }

  async tapAccept() {
    await Wbs.tapByText('Agree and continue')
  }

  async tapCoreMobile() {
    await Wbs.tapByXpath('//span[text()="Core mobile"]')
  }

  async tapConnectToCoreApp() {
    const xpath = '//button[contains(text(), "Connect to Core App")]'
    let tries = 5
    while (tries > 0) {
      await Wbs.tapByXpath(xpath)
      const visible = await Wbs.isVisibleByXpath(xpath, 2000)
      if (!visible) break
      tries--
    }
  }

  async tapCoreConnectWallet() {
    await Wbs.tapByText('Connect')
    await Wbs.tapByXpath('//div[@data-testid="connect-core-mobile"]')
  }

  async connectTermAndContinue() {
    await Wbs.tapByDataTestId('connect-terms-checkbox')
    await Wbs.tapByDataTestId('connect-terms-continue-btn')
  }

  async tapConnectWallet(dapp: string) {
    let xpath = ''
    switch (dapp) {
      case 'https://core.app/': // Core
        xpath = `//*[text()="${BrowserLoc.connectMyWallet}"]`
        break
      case 'https://app.aave.com/': // Aave
        xpath = '//*[text()="Connect wallet"]'
        break
      case 'https://lfj.gg/avalanche': // TraderJoe
        xpath = '//button[@aria-label="connect-wallet"]'
        break
      case 'https://app.benqi.fi/markets': // Benqi
        xpath = '//button[text()="Connect Wallet"]'
        break
      case 'https://ava-labs.github.io/extension-avalanche-playground/': // Core Playground
        xpath =
          '//button[text()="Connect via Wallet Connect - Universal Provider"]'
        break
      case 'https://app.uniswap.org/': // UniSwap
        xpath = '//button[@data-testid="navbar-connect-wallet"]'
        break
      case 'https://pancakeswap.finance/?chain=eth': // PancakeSwap
        xpath = '//div[text()="Connect"]'
        break
      default: // core app
        xpath = '//*[text()="WalletConnect"]'
    }
    await delay(2000)
    await Wbs.waitForEleByXpathToBeVisible(xpath, 10000)
    await Wbs.tapByXpath(xpath)
  }

  async tapWalletConnect() {
    await Wbs.waitForEleByTextToBeVisible('WalletConnect')
    await Wbs.tapByText('WalletConnect')
  }

  async tapCopyQrCode() {
    await Wbs.tapByXpath('//*[@class="wcm-action-btn"]')
  }

  async tapBrowserBackBtn() {
    while (!(await Actions.isVisible(this.suggested, 0))) {
      await Actions.tapElementAtIndex(this.browserBackBtn, 0)
    }
  }

  async tapbrowserRefreshBtn() {
    try {
      await Actions.tapElementAtIndex(this.browserRefreshBtn, 0)
    } catch (e) {
      console.error('Unable to tap refresh button')
    }
  }

  async connectCore() {
    await Wbs.waitAndRunScript('w3m-modal', WebScripts.CLICK_WC_CORE)
  }

  async getQrUri() {
    await delay(3000)
    const clickModal =
      Actions.platform() === 'ios'
        ? WebScripts.CLICK_WCM_IOS_MODAL
        : WebScripts.CLICK_WCM_ANDROID_MODAL

    await device.disableSynchronization()
    await Wbs.waitAndRunScript('wcm-modal', clickModal)
    await delay(1000)
    const output = await Wbs.getElementTextByRunScript(
      'wcm-modal',
      WebScripts.GET_WCM_URI,
      10000
    )
    await device.enableSynchronization()
    console.log(`QR URI - ${output}`)
    if (!output.length) throw Error("I couldn't get QR URI")
    return output
  }

  async dismissConnectWalletModal() {
    await Actions.waitForElement(this.continueBtn)
    await Actions.tap(this.continueBtn)
    await Actions.waitForElementNotVisible(this.continueBtn)
  }

  async connectLFJ() {
    await this.connect('https://lfj.gg/avalanche')
    await Wbs.tapByText('I read and accept')
    await Wbs.tapByXpath('//button[@data-cy="connector-walletConnect"]')
    const qrUri = await this.getQrUri()
    await plusMenuPage.connectWallet(qrUri)
    await connectToSitePage.selectAccountAndconnect()
    await popUpModalPage.verifySuccessToast()
  }

  async tapSend() {
    await Wbs.tapByText('Send')
  }

  async enterRpcCall(rpcCall: string) {
    await Wbs.waitForEleByXpathToBeVisible(
      '//input[@placeholder="Select a method..."]'
    )
    await Wbs.tapByXpath('//input[@placeholder="Select a method..."]')
    const dropdownOption = `//li[contains(@id, "option")]/span[contains(., "${rpcCall}")]`
    await Wbs.scrollToXpath(dropdownOption)
    await Wbs.tapByXpath(dropdownOption)
    await this.dismissiOSKeyboard()
  }

  async enterAvalancheTransactions(call: string) {
    await Wbs.waitForEleByXpathToBeVisible(
      '//input[@placeholder="Select a transaction..."]'
    )
    await Wbs.tapByXpath('//input[@placeholder="Select a transaction..."]')
    const dropdownOption = `//li/span[contains(., "${call}")]`
    await Wbs.scrollToXpath(dropdownOption)
    await Wbs.tapByXpath(dropdownOption)
    await this.dismissiOSKeyboard()
    await Wbs.tapByText('Execute transaction(s)')
  }

  async dismissiOSKeyboard() {
    if (Actions.platform() === 'ios') {
      try {
        await element(by.text('Done')).tap()
      } catch (e) {
        console.log('The done button is not displayed')
      }
    }
  }

  async goToRpcCallPage() {
    await Wbs.scrollToText('RPC Calls')
    await Wbs.tapByText('Home')
    await Wbs.tapByText('RPC Calls')
  }

  async sendRpcCall(rpcCall: string) {
    await this.goToRpcCallPage()
    await this.enterRpcCall(rpcCall)
    await this.tapSend()
  }

  async verifyResponseReceived(additionalText?: string) {
    try {
      await Wbs.waitForEleByTextToBeVisible('Response: ')
      if (additionalText) {
        await Wbs.waitForEleByTextToBeVisible(additionalText)
      }
      console.log('Successful response received!')
    } catch (e) {
      await Wbs.waitForEleByTextToBeVisible('Error: ')
      console.log('Not successful response received on the other end')
    }
  }

  async verifyErrorReceived(errorMessage = 'Error:') {
    await Wbs.isTextVisible(errorMessage)
  }

  async verifySuggestedBrowserList(list: string[]) {
    list.forEach(async browser => {
      await Actions.isVisible(by.text(browser), 0)
    })
  }

  async tapContinue() {
    try {
      await Actions.waitForElement(by.text('Continue'))
      await Actions.tap(by.text('Continue'))
    } catch (e) {
      console.log('The Continue button is not displayed')
    }
  }

  async goToUrl(url: string) {
    await bottomTabsPage.tapBrowserTab()
    await this.setUrl(url)
  }

  async getWalletConnectUri(visibleWalletConnectButton = false) {
    await this.tapWalletConnect()
    if (visibleWalletConnectButton) {
      await this.tapWalletConnect()
    }
    return await this.getQrUri()
  }

  async connectToCore() {
    await this.goToUrl(BrowserLoc.coreApp)
    await this.tapConnectWallet(BrowserLoc.coreApp)
    await this.tapCoreMobile()
    await this.tapAccept()
    await this.tapConnectToCoreApp()
    await popUpModalPage.selectAccountAndconnect()
  }

  async verifyCoreConnected() {
    await Actions.waitForElement(
      by.text(`Connected to ${BrowserLoc.coreDappName}`),
      10000
    )
    await Wbs.waitForEleByXpathToBeVisible('//h1[text()="Account 1"]', 50000)
    await Actions.failIfElementAppearsWithin(commonElsPage.transactionFail)
  }

  async connect(dapp: string) {
    await this.goToUrl(dapp)
    await this.getWalletConnectUri()
    const qrUri = await this.getQrUri()
    await plusMenuPage.connectWallet(qrUri)
    await connectToSitePage.selectAccountAndconnect()
  }

  async setDappSwapAmount(selector: string, amount = '0.00001') {
    await delay(2000)
    await Wbs.waitAndRunScript(
      selector,
      `function type (element) {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        nativeInputValueSetter.call(element, ${amount});
        element.dispatchEvent(new Event('input', { bubbles: true}));
      }`
    )
    await delay(3000)
  }

  async swapUniSwap() {
    await bottomTabsPage.tapBrowserTab()
    await Wbs.tapByXpath('//div[@data-testid="token-logo"]')
    await delay(1000)
    await Wbs.tapByXpath('//div[@data-testid="token-option-43114-AVAX"]')
    await delay(1000)
    await Wbs.tapByXpath('//span[@data-testid="choose-output-token-label"]')
    await delay(1000)
    await Wbs.tapByXpath('//div[@data-testid="token-option-43114-USDt"]')
    await this.setDappSwapAmount('[data-testid="amount-input-in"]')
    await Wbs.tapByXpath('//span[text()="Review"]')
    while (
      await Wbs.isVisibleByXpath(
        '//div[contains(@class, "is_Sheet")]//span[text()="Swap"]'
      )
    ) {
      await Wbs.tapByXpath(
        '//div[contains(@class, "is_Sheet")]//span[text()="Swap"]'
      )
    }
  }

  async swapLFJ() {
    await Wbs.tapByXpath("//a[@href='/trade']")
    await Wbs.tapByXpath("//button[contains(text(), 'Select token')]")
    await Wbs.setInputText(
      "//input[@data-cy='currency-picker-search-bar']",
      'JOE token'
    )
    await Wbs.tapByXpath("//p[text()='JOE']")
    await this.setDappSwapAmount('[data-cy="trade-currency-input"]')
    await Wbs.tapByXpath(
      "//button[@data-cy='swap-button' and text()='Swap' and not(@disabled)]"
    )
  }

  async getPlaygroundUri() {
    await Wbs.waitForEleByXpathToBeVisible(
      "//input[contains(@class, 'ant-input')]"
    )
    return await Wbs.getElementTextByRunScript(
      'input',
      '(ele) => ele.getAttribute("value")'
    )
  }

  async fundPChain() {
    await bottomTabsPage.tapStakeTab()
    const pChainBalanceText =
      (await Actions.getElementText(stakePage.claimableBalance)) || '0 AVAX'
    const pChainBalance: number = parseFloat(
      pChainBalanceText.replace(' AVAX', '')
    )
    console.log(`${pChainBalance} AVAX in P-Chain...`)
    if (pChainBalance < 0.1) {
      await this.connect(
        'https://ava-labs.github.io/extension-avalanche-playground/'
      )
      const qrUri = await this.getPlaygroundUri()
      console.log(qrUri)
      await plusMenuPage.connectWallet(qrUri)
      await connectToSitePage.selectAccountAndconnect()
      await bottomTabsPage.tapBrowserTab()
      await Wbs.tapByText('Avalanche Transactions')
      await this.enterAvalancheTransactions('Export from C to P')
      await Actions.waitForElement(by.text('Approve Export'), 40000)
      await popUpModalPage.tapApproveBtn()
      await Actions.waitForElement(by.text('Approve Import'), 40000)
      await popUpModalPage.tapApproveBtn()
    }
  }
}

export default new BrowserPage()
