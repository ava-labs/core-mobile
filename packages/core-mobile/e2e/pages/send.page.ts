import Actions from '../helpers/actions'
import popUpModalPage from '../pages/popUpModal.page'
import Send from '../locators/send.loc'
import assertions from '../helpers/assertions'
import sendLoc from '../locators/send.loc'
import commonElsPage from './commonEls.page'
import selectTokenPage from './selectToken.page'
import portfolioPage from './portfolio.page'
import collectiblesPage from './collectibles.page'

class SendPage {
  get addressBook() {
    return by.id(Send.addressBook)
  }

  get amountToSendInput() {
    return by.id(Send.amountToSend)
  }

  get sendSelectTokenListBtn() {
    return by.id(Send.sendSelectTokenListBtn)
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
    await Actions.waitForElementNoSync(this.nextButton, 8000)
    await Actions.tapElementAtIndex(this.nextButton, 0)
  }

  async waitForNextBtnEnabled() {
    await Actions.waitForElementNoSync(this.nextButton, 8000)
  }

  async tapSendField() {
    await Actions.tap(this.amountToSendInput)
  }

  async getSelectTokenList() {
    await Actions.tap(this.sendSelectTokenListBtn)
  }

  async tapApproveButton() {
    await Actions.waitForElement(this.approveButton, 20000)
    await Actions.tapElementAtIndex(this.approveButton, 0)
  }

  async tapRejectButton() {
    await Actions.tapElementAtIndex(this.rejectButton, 0)
  }

  async enterWalletAddress(address: string) {
    await Actions.setInputText(this.addressField, address, 0)
  }

  async tapMax() {
    await Actions.tap(this.max)
  }

  async enterAmount(amount: string) {
    await Actions.setInputText(this.amountToSendInput, amount, 0)
  }

  async send(token: string, amount: string, account = sendLoc.accountTwo) {
    await portfolioPage.tapSend()
    await commonElsPage.dismissTransactionOnboarding()
    await commonElsPage.typeSearchBar(account)
    await Actions.tapElementAtIndex(by.text(account), 1)
    await this.getSelectTokenList()
    await selectTokenPage.selectToken(token)
    await commonElsPage.enterAmount(amount)
    await commonElsPage.tapNextButton()
    await commonElsPage.tapApproveButton()
  }

  async sendNFT(nftName = 'BUNNY', account = sendLoc.accountTwo) {
    await collectiblesPage.tapNFT(nftName)
    await collectiblesPage.swipeUpForDetails()
    await portfolioPage.tapSend()
    await commonElsPage.dismissTransactionOnboarding()
    await commonElsPage.typeSearchBar(account)
    await Actions.tapElementAtIndex(by.text(account), 1)
    await commonElsPage.tapApproveButton()
  }

  // eslint-disable-next-line max-params
  async sendTokenTo2ndAccount(
    token: string,
    sendingAmmount: string,
    isCChain = true,
    isPXChain = false
  ) {
    await portfolioPage.tapSend()
    await commonElsPage.dismissTransactionOnboarding()
    await commonElsPage.typeSearchBar(sendLoc.accountTwo)
    await Actions.tapElementAtIndex(by.text(sendLoc.accountTwo), 1)
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
  }
}

export default new SendPage()
