import Actions from '../helpers/actions'
import AccountManagePage from '../pages/accountManage.page'
import BottomTabsPage from '../pages/bottomTabs.page'
import PlusMenuPage from '../pages/plusMenu.page'
import ReviewAndSend from '../pages/reviewAndSend.page'
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

  async tapAddressBook() {
    await Actions.tap(this.addressBook)
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

  async tapMyAccounts() {
    await Actions.tap(this.myAccounts)
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

  async sendTokenTo2ndAccount(token: string, sendingAmmount: string) {
    await BottomTabsPage.tapPlusIcon()
    const startTime = new Date().getTime()
    await Actions.waitForElement(PlusMenuPage.sendButton)
    const endTime = new Date().getTime()
    await Actions.reportUIPerformance(
      startTime,
      endTime,
      'PlusMenuScreen',
      1,
      3
    )
    await PlusMenuPage.tapSendButton()
    const startTime2 = new Date().getTime()
    await Actions.waitForElement(this.addressBook)
    const endTime2 = new Date().getTime()
    await Actions.reportUIPerformance(
      startTime2,
      endTime2,
      'SendTokenScreen',
      1,
      3
    )
    await this.tapAddressBook()
    await this.tapMyAccounts()
    await AccountManagePage.tapSecondAccount()
    await this.tapCarrotSVG()
    await this.selectToken(token)
    await this.enterAmount(sendingAmmount)
    await this.tapSendTitle()
    await this.tapNextButton()
    const startTime3 = new Date().getTime()
    await Actions.waitForElement(ReviewAndSend.balanceAfterTransaction)
    const endTime3 = new Date().getTime()
    await Actions.reportUIPerformance(
      startTime3,
      endTime3,
      'SendConfirmationScreen',
      1,
      3
    )
    await ReviewAndSend.tapSendNow()
    const startTime4 = new Date().getTime()
    await Actions.waitForElement(ReviewAndSend.sendSuccessfulToastMsg)
    const endTime4 = new Date().getTime()
    await Actions.reportUIPerformance(
      startTime4,
      endTime4,
      'SendSuccessfulMsg',
      1,
      3
    )
  }
}

export default new SendPage()
