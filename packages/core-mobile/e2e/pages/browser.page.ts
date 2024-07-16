import Actions from '../helpers/actions'
import Asserts from '../helpers/assertions'
import BrowserLoc from '../locators/browser.loc'

class BrowserPage {
  wb = web(by.id('myWebview'))

  get searchBar() {
    return by.id(BrowserLoc.searchBar)
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

  async tapConnectWallet() {
    await this.wb
      .element(by.web.xpath('//*[@data-testid="connect-wallet-button"]'))
      .tap()
  }

  async tapWalletConnect() {
    await this.wb
      .element(
        by.web.xpath(
          '//*[@data-testid="connect-wallet-connect-button"]//p[text()="WalletConnect"]'
        )
      )
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

  async selectAccountAndconnect() {
    await Actions.tap(by.text('Select Accounts'))
    await Actions.tapElementAtIndex(by.id('account_check_box'), 0)
    await Actions.tap(by.text('Approve'))
  }

  async verifyDappConnected() {
    await Asserts.isVisible(by.text('Connected to Core'))
    try {
      await this.wb
        .element(by.web.xpath('//*[@data-testid="connect-wallet-button"]'))
        .tap()
      fail('We should not have connect wallet button after connected')
    } catch (e) {
      console.log('Verify there is no connect wallet button')
    }
  }
}

export default new BrowserPage()
