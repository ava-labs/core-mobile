import actions from '../helpers/actions'
import asserts from '../helpers/assertions'
import popupModalLoc from '../locators/popupModal.loc'

class PopUpModalPage {
  get signMessage() {
    return by.text(popupModalLoc.signMessage)
  }

  get network() {
    return by.text(popupModalLoc.network)
  }

  get approveBtn() {
    return by.id(popupModalLoc.approveBtn)
  }

  get rejectBtn() {
    return by.id(popupModalLoc.rejectBtn)
  }

  get account() {
    return by.text(popupModalLoc.account)
  }

  get messageTitle() {
    return by.text(popupModalLoc.messageTitle)
  }

  get scamTransaction() {
    return by.text(popupModalLoc.scamTransaction)
  }

  get scamTransactionContent() {
    return by.text(popupModalLoc.scamTransactionContent)
  }

  get rejectTransaction() {
    return by.text(popupModalLoc.rejectTransaction)
  }

  get proceedAnyway() {
    return by.text(popupModalLoc.proceedAnyway)
  }

  get switchToSepoliaNetwork() {
    return by.text(popupModalLoc.switchToSepoliaNetwork)
  }

  get switchToFujiNetwork() {
    return by.text(popupModalLoc.switchToFujiNetwork)
  }

  get createContact() {
    return by.text(popupModalLoc.createContact)
  }

  get messageDetail() {
    return by.id(popupModalLoc.messageDetail)
  }

  async tapApproveBtn() {
    await actions.tapElementAtIndex(this.approveBtn, 0)
  }

  async tapRejectBtn() {
    await actions.tapElementAtIndex(this.rejectBtn, 0)
  }

  async verifySignMessageModal() {
    await actions.waitForElement(this.signMessage, 8000)
    await asserts.isVisible(this.network)
    await asserts.isVisible(this.account)
    await asserts.isVisible(this.messageTitle)
    await asserts.isVisible(this.approveBtn)
    await asserts.isVisible(this.rejectBtn)
  }

  async verifyScamAlertedSignMessageModal() {
    await this.verifySignMessageModal()
    await actions.waitForElement(this.scamTransaction)
    await asserts.isVisible(this.scamTransactionContent)
  }

  async verifySwitchToSepoliaNetworkModal() {
    await actions.waitForElement(this.switchToSepoliaNetwork, 8000)
    await asserts.isVisible(this.approveBtn)
    await asserts.isVisible(this.rejectBtn)
  }

  async verifySwitchToFujiNetworkModal() {
    await actions.waitForElement(this.switchToFujiNetwork, 8000)
    await asserts.isVisible(this.approveBtn)
    await asserts.isVisible(this.rejectBtn)
  }

  async verifyScamTransactionModal() {
    await actions.waitForElement(this.scamTransaction, 8000)
    await asserts.isVisible(this.scamTransactionContent)
    await asserts.isVisible(this.rejectTransaction)
    await asserts.isVisible(this.proceedAnyway)
  }

  async tapProceedAnyway() {
    await actions.tap(this.proceedAnyway)
  }

  async verifyCreateContactModal() {
    await actions.waitForElement(this.createContact, 8000)
    await asserts.isVisible(this.approveBtn)
    await asserts.isVisible(this.rejectBtn)
    await asserts.isVisible(by.text('Bob'))
  }
}

export default new PopUpModalPage()
