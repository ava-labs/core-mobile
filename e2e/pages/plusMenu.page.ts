import Actions from '../helpers/actions'
import PlusMenuLoc from '../locators/plusMenu.loc'

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

  async connectWallet(clipboardValue: string) {
    await Actions.setInputText(this.inputTextField, clipboardValue, 0)
    await Actions.tap(this.connectionURI)
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
}

export default new PlusMenuPage()
