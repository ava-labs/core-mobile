// import assert from 'assert'
import Actions from '../helpers/actions'
import BrowserLoc from '../locators/browser.loc'
import Wbs, { WebScripts } from '../helpers/web'
import delay from '../helpers/waits'
import commonElsPage from './commonEls.page'
import bottomTabsPage from './bottomTabs.page'

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

  async enterBrowserSearchQuery(query: string) {
    await Actions.setInputText(this.searchBar, query)
    await element(this.searchBar).tapReturnKey()
  }

  async tapAccept() {
    await Wbs.tapByText('Accept')
  }

  async tapCoreConnectWallet() {
    await Wbs.tapByText('Connect Wallet')
  }

  async connectTermAndContinue() {
    await Wbs.tapByDataTestId('connect-terms-checkbox')
    await Wbs.tapByDataTestId('connect-terms-continue-btn')
  }

  async tapConnectWallet(dapp = 'Core') {
    let xpath = ''
    switch (dapp) {
      case 'https://app.aave.com/': // Aave
        xpath = '//*[text()="Connect wallet"]'
        break
      case 'https://traderjoexyz.com/avalanche': // TraderJoe
        xpath = '//button[@aria-label="connect-wallet"]'
        break
      case 'https://opensea.io/': // OpenSea
        xpath = '//button[@data-id="UnstyledButton"]//div[text()="Login"]'
        break
      case 'https://ava-labs.github.io/extension-avalanche-playground/': // Core Playground
        xpath = '//button[text()="Connect via Wallet Connect - Wagmi"]'
        break
      default: // core app
        xpath = '//*[text()="WalletConnect"]'
    }
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

  async getQrUriViaAllWallets() {
    await Wbs.waitAndRunScript('w3m-modal', WebScripts.CLICK_WC_ALL_WALLETS)
    await Wbs.waitAndRunScript('w3m-modal', WebScripts.CLICK_WC_QR_BUTTON)
    const output = await Wbs.waitAndRunScript(
      'w3m-modal',
      WebScripts.GET_WC_URI
    )
    console.log(`QR URI - ${output}`)
    return output
  }

  async getQrUri() {
    await delay(2000)
    if (Actions.platform() === 'ios') {
      await Wbs.waitAndRunScript('wcm-modal', WebScripts.CLICK_WCM_IOS_MODAL)
    } else {
      await Wbs.waitAndRunScript(
        'wcm-modal',
        WebScripts.CLICK_WCM_ANDROID_MODAL
      )
    }
    const output = await Wbs.waitAndRunScript(
      'wcm-modal',
      WebScripts.GET_WCM_URI
    )
    console.log(`QR URI - ${output}`)
    return output
  }

  async dismissConnectWalletModal() {
    await Actions.waitForElementNoSync(this.continueBtn, 10000)
    await Actions.tap(this.continueBtn)
    await Actions.waitForElementNotVisible(this.continueBtn, 5000)
  }

  async connectTo(
    dapp: string,
    showModal = false,
    visibleWalletConnectButton = true
  ) {
    await Actions.waitForElement(bottomTabsPage.plusIcon)
    await bottomTabsPage.tapBrowserTab()
    try {
      await commonElsPage.tapGetStartedButton()
    } catch (e) {
      console.log('The Get Started Button is not displayed')
    }
    try {
      while (await Actions.isVisible(this.browserBackBtn, 0)) {
        await this.tapBrowserBackBtn()
      }
    } catch (e) {
      console.log('There is no web browser history to go back')
    }
    await this.tapSearchBar()
    await this.enterBrowserSearchQuery(dapp)
    if (showModal) {
      await this.dismissConnectWalletModal()
    }
    await this.tapConnectWallet(dapp)
    if (visibleWalletConnectButton) {
      await this.tapWalletConnect()
    }
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

  async reconnectRpc() {
    await this.tapConnectWallet(
      'https://ava-labs.github.io/extension-avalanche-playground/'
    )
    await Wbs.waitAndRunScript('w3m-modal', WebScripts.CLICK_WC_ALL_WALLETS)
    await Wbs.waitAndRunScript('w3m-modal', WebScripts.CLICK_WC_QR_BUTTON)
  }

  async sendRpcCall(rpcCall: string) {
    await bottomTabsPage.tapBrowserTab()
    try {
      await this.reconnectRpc()
    } catch (e) {
      console.log('No need to reconnect RPC Playground')
    }
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
      await Actions.tap(by.text('Continue'))
    } catch (e) {
      console.log('The Continue button is not displayed')
    }
  }
}

export default new BrowserPage()
