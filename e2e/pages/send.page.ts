import Actions from '../helpers/actions'
import Send from '../locators/send.loc'

class SendPage {
  get textInputField() {
    return by.id(Send.testInputField)
  }

  get tokenDropdown() {
    return by.id(Send.tokenDropdown)
  }

  get carrotSVG() {
    return by.id('carrot_svg')
  }

  get amountField() {
    return by.id(Send.amountField)
  }

  get nextButton() {
    return by.text(Send.nextBtn)
  }

  get sendTitle() {
    return by.text(Send.sendTitle)
  }

  async tapSendTitle() {
    await Actions.tap(this.sendTitle)
  }

  async tapNextButton() {
    await Actions.tap(this.nextButton)
  }

  async tapCarrotSVG() {
    await Actions.tap(this.carrotSVG)
  }

  async tapSendField() {
    await Actions.tap(this.textInputField)
  }

  async tapTokenDropdown() {
    await Actions.tap(this.tokenDropdown)
  }

  async enterWalletAddress(address: string) {
    await Actions.setInputText(this.textInputField, address, 0)
  }

  async selectToken(tokenName: string) {
    await element(by.text(`${tokenName}`)).tap()
  }

  async enterAmount(amount: string) {
    await Actions.setInputText(this.textInputField, amount, 1)
  }
}

export default new SendPage()
