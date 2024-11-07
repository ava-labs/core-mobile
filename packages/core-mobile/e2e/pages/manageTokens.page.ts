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

  async showToken(token: string, isOn = true) {
    await commonElsPage.typeSearchBar(token)
    // Set `isOn` false if you want to hide token.
    // Toggle it if it's already displayed or blocked
    const oppositeStatus = isOn ? 'displayed' : 'blocked'
    const expectedStatus = isOn ? 'blocked' : 'displayed'
    try {
      await Action.waitForElement(by.id(`${token}_${oppositeStatus}`))
      await Action.tap(by.id(`${token}_${oppositeStatus}`))
      console.log(
        `The token was ${oppositeStatus} and now it's ${expectedStatus}`
      )
    } catch (e) {
      console.log(`The token is currently ${expectedStatus}`)
    }
    // Display the token
    await Action.tap(by.id(`${token}_${expectedStatus}`))
    console.log(`The token is now ${oppositeStatus}`)
    await commonElsPage.goBack()
  }
}

export default new ManageTokensPage()
