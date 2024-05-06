import delay from '../helpers/waits'
import Actions from '../helpers/actions'
import AccountManagePage from '../pages/accountManage.page'
import BottomTabsPage from '../pages/bottomTabs.page'
import PlusMenuPage from '../pages/plusMenu.page'
import Send from '../locators/send.loc'

class SendPage {
  get addressBook() {
    return by.id(Send.addressBook)
  }

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

  get myAccounts() {
    return by.text(Send.myAccounts)
  }

  get nextButton() {
    return by.text(Send.nextBtn)
  }

  get sendTitle() {
    return by.text(Send.sendTitle)
  }

  get approveButton() {
    return by.id(Send.approveBtn)
  }

  get rejectButton() {
    return by.text(Send.rejectBtn)
  }

  async tapAddressBook() {
    await Actions.tap(this.addressBook)
  }

  async tapSendTitle() {
    await Actions.tap(this.sendTitle)
  }

  async tapNextButton() {
    await Actions.tapElementAtIndex(this.nextButton, 0)
  }

  async tapCarrotSVG() {
    await Actions.tap(this.carrotSVG)
  }

  async tapMyAccounts() {
    await Actions.tap(this.myAccounts)
  }

  async tapSendField() {
    await Actions.tap(this.textInputField)
  }

  async tapTokenDropdown() {
    await Actions.tap(this.tokenDropdown)
  }

  async tapApproveButton() {
    await Actions.tapElementAtIndex(this.approveButton, 0)
  }

  async tapRejectButton() {
    await Actions.tapElementAtIndex(this.rejectButton, 0)
  }

  async enterWalletAddress(address: string) {
    await Actions.setInputText(this.textInputField, address, 0)
  }

  async selectToken(tokenName: string, index = 0) {
    await element(by.text(`${tokenName}`))
      .atIndex(index)
      .tap()
  }

  async enterAmount(amount: string) {
    await Actions.setInputText(this.textInputField, amount, 1)
  }

  async sendTokenTo2ndAccount(token: string, sendingAmmount: string) {
    await Actions.waitForElement(BottomTabsPage.plusIcon)
    await BottomTabsPage.tapPlusIcon()
    await Actions.waitForElement(PlusMenuPage.sendButton)
    await PlusMenuPage.tapSendButton()
    await Actions.waitForElement(this.addressBook)

    await this.tapAddressBook()
    await this.tapMyAccounts()
    await AccountManagePage.tapSecondAccountMenu()
    await this.tapCarrotSVG()
    await this.selectToken(token)
    await this.enterAmount(sendingAmmount)
    await this.tapSendTitle()
    await this.tapNextButton()
    await delay(2000)
    await this.tapApproveButton()
    // await Actions.waitForElement(ReviewAndSend.sendSuccessfulToastMsg)
  }
}

export default new SendPage()
