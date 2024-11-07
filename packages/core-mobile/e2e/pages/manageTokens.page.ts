import manageTokens from '../locators/manageTokens.loc'
import Action from '../helpers/actions'
import commonElsPage from './commonEls.page'

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

  async hideToken(token: string) {
    await commonElsPage.typeSearchBar(token)
    // TryCatch Phrase is for test requirment
    try {
      await Action.waitForElement(by.id(`${token}_blocked`))
      await Action.tap(by.id(`${token}_blocked`))
      console.log("Display the token if it's already hidden")
    } catch (e) {
      console.log("It's already displayed on token list")
    }
    // Hide the token
    await Action.tap(by.id(`${token}_displayed`))
    await commonElsPage.goBack()
  }

  async showToken(token: string) {
    await commonElsPage.typeSearchBar(token)
    // TryCatch Phrase is for test requirment
    try {
      await Action.waitForElement(by.id(`${token}_display`))
      await Action.tap(by.id(`${token}_blocked`))
      console.log("Block the token if it's already displayed")
    } catch (e) {
      console.log("It's already blocked")
    }
    // Display the token
    await Action.tap(by.id(`${token}_blocked`))
    await commonElsPage.goBack()
  }
}

export default new ManageTokensPage()
