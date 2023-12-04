import nameWalletLoc from '../locators/nameWallet.loc'
import actions from '../helpers/actions'
import delay from '../helpers/waits'

class NameWalletPage {
  get nameWalletInput() {
    return by.id(nameWalletLoc.nameWalletInput)
  }

  get goBtn() {
    return by.label(nameWalletLoc.goBtn)
  }

  async enterWalletName(walletName: string) {
    await element(this.nameWalletInput).typeText(walletName)
  }

  async tapGoBtn() {
    await delay(1000)
    await actions.tapElementAtIndex(this.goBtn, 0)
  }

  async tapNameWalletInput() {
    await actions.tapElementAtIndex(this.nameWalletInput, 0)
  }
}

export default new NameWalletPage()
