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
    let isShown = await Action.isVisible(by.id(`${token}_displayed`), 0)
    while (isShown) {
      await Action.tap(by.id(`${token}_displayed`))
      isShown = await Action.isVisible(by.id(`${token}_displayed`), 0)
    }
    await commonElsPage.goBack()
  }

  async showToken(token: string) {
    await commonElsPage.typeSearchBar(token)
    let isHidden = await Action.isVisible(by.id(`${token}_blocked`), 0)
    while (isHidden) {
      await Action.tap(by.id(`${token}_blocked`))
      isHidden = await Action.isVisible(by.id(`${token}_blocked`), 0)
    }
    await commonElsPage.goBack()
  }
}

export default new ManageTokensPage()
