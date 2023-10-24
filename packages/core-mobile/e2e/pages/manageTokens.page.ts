import manageTokens from '../locators/manageTokens.loc'
import Action from '../helpers/actions'

class ManageTokensPage {
  get addButton() {
    return by.text(manageTokens.addButton)
  }

  get addcustomToken() {
    return by.text(manageTokens.addcustomToken)
  }

  get addedMessage() {
    return by.text(manageTokens.addedMessage)
  }

  get inputContractAddress() {
    return by.id(manageTokens.inputContractAddress)
  }

  async tapAddcustomToken() {
    await Action.tapElementAtIndex(this.addcustomToken, 0)
  }

  async tapAddButton() {
    await Action.tapElementAtIndex(this.addButton, 0)
  }

  async inputCustomToken() {
    await Action.setInputText(
      this.inputContractAddress,
      manageTokens.customTokenContract,
      0
    )
  }
}

export default new ManageTokensPage()
