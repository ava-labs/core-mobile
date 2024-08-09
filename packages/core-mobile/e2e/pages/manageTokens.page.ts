import manageTokens from '../locators/manageTokens.loc'
import Action from '../helpers/actions'

class ManageTokensPage {
  get addButton() {
    return by.text(manageTokens.addButton)
  }

  get addcustomToken() {
    return by.text(manageTokens.addcustomToken)
  }

  get added() {
    return by.text(manageTokens.added)
  }

  get inputContractAddress() {
    return by.id(manageTokens.inputContractAddress)
  }

  get manageTokenList() {
    return by.text(manageTokens.manageTokenList)
  }

  get customCChainTokenName() {
    return by.text(manageTokens.customCChainTokenName)
  }

  async tapAddcustomToken() {
    await Action.tapElementAtIndex(this.addcustomToken, 0)
  }

  async tapAddButton() {
    await Action.tapElementAtIndex(this.addButton, 0)
  }

  async inputCustomToken(address: string) {
    await Action.setInputText(this.inputContractAddress, address, 0)
  }
}

export default new ManageTokensPage()
