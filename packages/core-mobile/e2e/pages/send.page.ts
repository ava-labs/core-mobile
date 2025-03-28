import Actions from '../helpers/actions'
import AccountManagePage from '../pages/accountManage.page'
import BottomTabsPage from '../pages/bottomTabs.page'
import PlusMenuPage from '../pages/plusMenu.page'
import popUpModalPage from '../pages/popUpModal.page'
import Send from '../locators/send.loc'
import delay from '../helpers/waits'
import assertions from '../helpers/assertions'
import commonElsPage from './commonEls.page'

class SendPage {
  get addressBook() {
    return by.id(Send.addressBook)
  }

  get amountToSendInput() {
    return by.id(Send.amountToSend)
  }

  get tokenDropdown() {
    return by.id(Send.tokenDropdown)
  }

  get amountField() {
    return by.id(Send.amountField)
  }

  get myAccounts() {
    return by.text(Send.myAccounts)
  }

  get nextButton() {
    return by.id(Send.nextBtn)
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

  get addressField() {
    return by.id(Send.addressField)
  }

  get searchBarOnSelectToken() {
    return by.id(Send.searchBarOnSelectToken)
  }

  get selectTokenTitle() {
    return by.text(Send.selectTokenTitle)
  }

  get sendTo() {
    return by.text(Send.sendTo)
  }

  get max() {
    return by.text(Send.max)
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

  async waitForNextBtnEnabled() {
    await Actions.waitForElementNoSync(this.nextButton, 8000)
  }

  async tapMyAccounts() {
    await Actions.tap(this.myAccounts)
  }

  async tapSendField() {
    await Actions.tap(this.amountToSendInput)
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
    await Actions.setInputText(this.addressField, address, 0)
  }

  async selectToken(tokenName: string) {
    await Actions.waitForElement(this.searchBarOnSelectToken)
    await Actions.setInputText(this.searchBarOnSelectToken, tokenName)
    await delay(1000)
    await Actions.tapElementAtIndex(by.id(`token_selector__${tokenName}`), 0)
  }

  async tapMax() {
    await Actions.tap(this.max)
  }

  async enterAmount(amount: string) {
    await Actions.setInputText(this.amountToSendInput, amount, 0)
  }

  // eslint-disable-next-line max-params
  async sendTokenTo2ndAccount(
    token: string,
    sendingAmmount: string,
    isCChain = true,
    isPXChain = false
  ) {
    await Actions.waitForElement(BottomTabsPage.plusIcon)
    await BottomTabsPage.tapPlusIcon()
    await PlusMenuPage.tapSendButton()
    await this.tapAddressBook()
    await this.tapMyAccounts()
    await AccountManagePage.tapSecondAccountMenu()
    await this.tapTokenDropdown()
    await this.selectToken(token)
    try {
      await Actions.waitForElement(by.text(`Balance 0 ${token}`))
      await commonElsPage.goBack()
      console.log(`No ${token} on your wallet`)
      return false
    } catch (e) {
      await this.enterAmount(sendingAmmount)
      await this.waitForNextBtnEnabled()
      await this.tapSendTitle()
      await this.tapNextButton()
      await popUpModalPage.verifyFeeIsLegit(isCChain, isPXChain)
      await this.tapApproveButton()
      return true
    }
  }

  async verifySuccessToast(hasBalance = true) {
    if (hasBalance) {
      await Actions.waitForElement(popUpModalPage.successfulToastMsg, 120000)
      await Actions.waitForElementNotVisible(
        popUpModalPage.successfulToastMsg,
        120000
      )
    }
  }

  async verifySendScreen() {
    await Actions.waitForElement(this.sendTitle)
    await assertions.isVisible(this.sendTo)
    await assertions.isVisible(this.amountToSendInput)
    await assertions.isVisible(this.tokenDropdown)
  }
}

export default new SendPage()
