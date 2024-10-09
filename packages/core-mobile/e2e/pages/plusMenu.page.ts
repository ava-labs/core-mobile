import Actions from '../helpers/actions'
import PlusMenuLoc from '../locators/plusMenu.loc'
import portfolioLoc from '../locators/portfolio.loc'
import bottomTabsPage from './bottomTabs.page'
import scanQrCodePage from './scanQrCode.page'

class PlusMenuPage {
  get bridgeButton() {
    return by.id(PlusMenuLoc.bridge)
  }

  get connectionURI() {
    return by.text(PlusMenuLoc.connectionURI)
  }

  get sendButton() {
    return by.id(PlusMenuLoc.send)
  }

  get swapButton() {
    return by.id(PlusMenuLoc.swap)
  }

  get walletConnectButtonSVG() {
    return by.id(PlusMenuLoc.walletConnectSVG)
  }

  get inputTextField() {
    return by.id(PlusMenuLoc.inputTextField)
  }

  get walletConnectInputField() {
    return by.id(PlusMenuLoc.inputTextField)
  }

  get walletConnectButton() {
    return by.text(PlusMenuLoc.walletConnectButton)
  }

  get receiveButton() {
    return by.id(PlusMenuLoc.receive)
  }

  get buyButton() {
    return by.id(PlusMenuLoc.buy)
  }

  async tapReceiveButton() {
    await Actions.tap(this.receiveButton)
  }

  async tapBuyButton() {
    await Actions.tap(this.buyButton)
  }

  async connectWallet(qrUri: string) {
    await bottomTabsPage.tapPortfolioTab()
    await bottomTabsPage.tapPlusIcon()
    await this.tapWalletConnectButton()
    await scanQrCodePage.setQrCode(qrUri.toString())
  }

  async tapBridgeButton() {
    await Actions.tap(this.bridgeButton)
  }

  async tapSendButton() {
    await Actions.tap(this.sendButton)
  }

  async tapSwapButton() {
    await Actions.tap(this.swapButton)
  }

  async tapWalletConnectButton() {
    await Actions.tap(this.walletConnectButton)
  }

  async verifyPlusIconOptions(network: string) {
    const options: string[] = [
      PlusMenuLoc.send,
      PlusMenuLoc.swap,
      PlusMenuLoc.buy,
      PlusMenuLoc.receive,
      PlusMenuLoc.walletConnectSVG,
      PlusMenuLoc.bridge
    ]
    for (const option of options) {
      if (
        network === portfolioLoc.avaxNetwork ||
        (option !== PlusMenuLoc.buy && option !== PlusMenuLoc.swap)
      ) {
        // Show the option if it's the avaxNetwork or not a restricted option
        await Actions.waitForElement(by.id(option))
      } else {
        // Hide the swap and buy for all the other networks
        await Actions.waitForElementNotVisible(by.id(option))
      }
    }
  }
}

export default new PlusMenuPage()
