import Actions from '../helpers/actions'
import PlusMenuLoc from '../locators/plusMenu.loc'

class PlusMenuPage {
  get sendButton() {
    return by.id(PlusMenuLoc.send)
  }

  get walletConnectButton() {
    return by.id(PlusMenuLoc.walletConnectSVG)
  }

  async tapSendButton() {
    await Actions.tap(this.sendButton)
  }

  async tapWalletConnectButton() {
    await Actions.tap(this.walletConnectButton)
  }
}

export default new PlusMenuPage()
