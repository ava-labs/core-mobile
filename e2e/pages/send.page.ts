import Actions from '../helpers/actions'
import Send from '../locators/send.loc'

class SendPage {
  get textInputField() {
    return by.id(Send.testInputField)
  }

  async tapSendField() {
    await Actions.tap(this.textInputField)
  }

  async enterWalletAddress(address: string) {
    await Actions.setInputText(this.textInputField, address, 0)
  }
}

export default new SendPage()
