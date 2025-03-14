import nameWalletLoc from '../locators/nameWallet.loc'
import actions from '../helpers/actions'
import delay from '../helpers/waits'
import assertions from '../helpers/assertions'

class NameWalletPage {
  get nameWalletInput() {
    return by.id(nameWalletLoc.nameWalletInput)
  }

  get goBtn() {
    return by.label(nameWalletLoc.goBtn)
  }

  get title() {
    return by.text(nameWalletLoc.title)
  }

  get content() {
    return by.text(nameWalletLoc.content)
  }

  async enterWalletName(walletName: string) {
    await actions.waitForElement(this.nameWalletInput)
    await element(this.nameWalletInput).replaceText(walletName)
  }

  async tapGoBtn() {
    await delay(1000)
    await actions.tapElementAtIndex(this.goBtn, 0)
  }

  async tapNameWalletInput() {
    await actions.tapElementAtIndex(this.nameWalletInput, 0)
  }

  async verifyNameWalletPage() {
    await actions.waitForElement(this.title)
    await assertions.isVisible(this.content)
  }
}

export default new NameWalletPage()
