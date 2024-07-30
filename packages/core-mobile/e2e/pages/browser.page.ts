import assert from 'assert'
import Actions from '../helpers/actions'
import BrowserLoc from '../locators/browser.loc'
import delay from '../helpers/waits'
import commonElsPage from './commonEls.page'
import bottomTabsPage from './bottomTabs.page'
class BrowserPage {
  wb =
    device.getPlatform() === 'ios'
      ? web(by.id('myWebview'))
      : web(by.type('android.webkit.WebView').withAncestor(by.id('myWebview')))

  get searchBar() {
    return by.id(BrowserLoc.searchBar)
  }

  get browserBackBtn() {
    return by.id(BrowserLoc.browserBackBtn)
  }

  async tapSearchBar() {
    await Actions.tapElementAtIndex(this.searchBar, 0)
  }

  async enterBrowserSearchQuery(query: string) {
    await Actions.setInputText(this.searchBar, query)
    await element(this.searchBar).tapReturnKey()
  }

  async tapAccept() {
    await this.wb.element(by.web.xpath('//*[text()="Accept"]')).tap()
  }

  async tapCoreConnectWallet() {
    await this.wb
      .element(by.web.xpath('//*[@data-testid="connect-wallet-button"]'))
      .tap()
  }

  async connectTermAndContinue() {
    await this.wb
      .element(by.web.xpath('//*[@data-testid="connect-terms-checkbox"]'))
      .tap()
    await this.wb
      .element(by.web.xpath('//*[@data-testid="connect-terms-continue-btn"]'))
      .tap()
  }

  async connectCore() {
    await this.wb
      .element(by.web.tag('w3m-modal'))
      .runScript(function (element) {
        element.shadowRoot
          .querySelector('wui-flex > wui-card > w3m-router')
          .shadowRoot.querySelector('w3m-connect-view')
          .shadowRoot.querySelector('wui-list-wallet[name="Core"]')
          .click()
      })
  }

  async verifyInAppBrowserLoaded(url: string, timeout = 8000) {
    let isLoaded = false
    const start = Date.now()
    while (Date.now() - start < timeout) {
      const currUrl = await this.wb.element(by.web.tag('body')).getCurrentUrl()
      isLoaded = currUrl === url
      if (isLoaded) break
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    assert(isLoaded)
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
        xpath =
          '//*[@data-testid="connect-wallet-connect-button"]//p[text()="WalletConnect"]'
    }
    await this.wb.element(by.web.xpath(xpath)).tap()
  }

  async tapWalletConnect() {
    await this.wb.element(by.web.xpath(`//*[text()="WalletConnect"]`)).tap()
  }

  async tapCopyQrCode() {
    await this.wb.element(by.web.xpath(`//*[@class='wcm-action-btn']`)).tap()
  }

  async tapBrowserBackBtn() {
    await Actions.tap(this.browserBackBtn)
  }

  async getQrUriViaAllWallets() {
    await delay(1000)
    await this.wb
      .element(by.web.tag('w3m-modal'))
      .runScript(function (element) {
        element.shadowRoot
          .querySelector('w3m-router')
          .shadowRoot.querySelector('w3m-connect-view')
          .shadowRoot.querySelector('wui-list-wallet[name="All Wallets"]')
          .click()
      })

    await delay(1000)
    await this.wb
      .element(by.web.tag('w3m-modal'))
      .runScript(function (element) {
        element.shadowRoot
          .querySelector('w3m-router')
          .shadowRoot.querySelector('w3m-all-wallets-view')
          .shadowRoot.querySelector('wui-icon-box')
          .click()
      })

    await delay(1000)
    const output = await this.wb
      .element(by.web.tag('w3m-modal'))
      .runScript(function (element) {
        return element.shadowRoot
          .querySelector('w3m-router')
          .shadowRoot.querySelector('w3m-connecting-wc-view')
          .shadowRoot.querySelector('w3m-connecting-wc-qrcode')
          .shadowRoot.querySelector('wui-qr-code')
          .getAttribute('uri')
      })
    console.log(`QR URI - ${output}`)
    return output
  }

  async getQrUri() {
    await delay(2000)
    if (device.getPlatform() === 'android') {
      await this.wb
        .element(by.web.tag('wcm-modal'))
        .runScript(function (element) {
          element.shadowRoot
            .querySelector('wcm-modal-router')
            .shadowRoot.querySelector('wcm-connect-wallet-view')
            .shadowRoot.querySelector('wcm-android-wallet-selection')
            .shadowRoot.querySelector('wcm-modal-header')
            .shadowRoot.querySelector('button')
            .click()
        })
    } else {
      await this.wb
        .element(by.web.tag('wcm-modal'))
        .runScript(function (element) {
          element.shadowRoot
            .querySelector('wcm-modal-router')
            .shadowRoot.querySelector('wcm-connect-wallet-view')
            .shadowRoot.querySelector('wcm-mobile-wallet-selection')
            .shadowRoot.querySelector('wcm-modal-header')
            .shadowRoot.querySelector('button')
            .click()
        })
    }
    await delay(2000)
    const output = await this.wb
      .element(by.web.tag('wcm-modal'))
      .runScript(function (element) {
        return element.shadowRoot
          .querySelector('wcm-modal-router')
          .shadowRoot.querySelector('wcm-qrcode-view')
          .shadowRoot.querySelector('wcm-walletconnect-qr')
          .shadowRoot.querySelector('wcm-qrcode')
          .getAttribute('uri')
      })
    console.log(`QR URI - ${output}`)
    return output
  }

  async dismissConnectWalletModal() {
    await delay(5000)
    if (device.getPlatform() === 'android') {
      await device.pressBack()
    } else {
      await Actions.waitForElement(by.id('warning_modal__i_understand_button'))
      await Actions.tap(by.id('warning_modal__i_understand_button'))
    }
    await delay(2000)
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
      await this.tapBrowserBackBtn()
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
    await this.wb.element(by.web.xpath('//button[text()="Send"]')).tap()
  }

  async enterRpcCall(rpcCall: string) {
    await delay(1000)
    await this.wb
      .element(by.web.xpath('//input[@placeholder="Select a method..."]'))
      .tap()
    const currDropdown = `//li[contains(@id, "option")]/span[contains(., "${rpcCall}")]`
    await this.wb.element(by.web.xpath(currDropdown)).scrollToView()
    await this.wb.element(by.web.xpath(currDropdown)).tap()
    try {
      await element(by.text('Done')).tap()
    } catch (e) {
      console.log('The done button is not displayed')
    }
  }

  async goToRpcCallPage() {
    await this.wb
      .element(by.web.xpath('//*[text()="RPC Calls"]'))
      .scrollToView()
    await this.wb.element(by.web.xpath('//*[text()="Home"]')).tap()
    await this.wb.element(by.web.xpath('//*[text()="RPC Calls"]')).tap()
  }

  async sendRpcCall(rpcCall: string) {
    await bottomTabsPage.tapBrowserTab()
    await delay(2000)
    await this.goToRpcCallPage()
    await this.enterRpcCall(rpcCall)

    await this.tapSend()
    await delay(2000)
  }

  async verifyResponseReceived(additionalText?: string) {
    try {
      await detox
        .expect(this.wb.element(by.web.xpath('//*[contains(., "Error:")]')))
        .toExist()
      console.log('Error received on WebView, not mobile side error')
    } catch (e) {
      await detox
        .expect(this.wb.element(by.web.xpath('//*[contains(., "Response:")]')))
        .toExist()
      if (additionalText) {
        await detox
          .expect(
            this.wb.element(
              by.web.xpath(`//*[contains(., "${additionalText}")]`)
            )
          )
          .toExist()
      }
      console.log('Successful response received!')
    }
  }

  async verifyErrorReceived(errorMessage = 'Error:') {
    await detox
      .expect(
        this.wb.element(by.web.xpath(`//*[contains(., "${errorMessage}")]`))
      )
      .toExist()
  }
}

export default new BrowserPage()
