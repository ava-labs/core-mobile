import Actions from '../helpers/actions'
import PlusMenuLoc from '../locators/plusMenu.loc'

class PlusMenuPage {
  get connectionURI() {
    return by.text(PlusMenuLoc.connectionURI)
  }

  get sendButton() {
    return by.id(PlusMenuLoc.send)
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

  async tapSendButton() {
    await Actions.tap(this.sendButton)
  }

  async tapWalletConnectButton() {
    await Actions.tap(this.walletConnectButton)
  }
}

export default new PlusMenuPage()
