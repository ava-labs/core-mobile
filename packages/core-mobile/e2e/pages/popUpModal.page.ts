import assert from 'assert'
import actions from '../helpers/actions'
import asserts from '../helpers/assertions'
import popUpModalLoc from '../locators/popupModal.loc'
import sendPage from './send.page'

class PopUpModalPage {
  get toastMessage() {
    return by.text(popUpModalLoc.toastMessage)
  }

  get linkSvg() {
    return by.id(popUpModalLoc.linkSvg)
  }

  get approveBtn() {
    return by.id(popUpModalLoc.approveBtn)
  }

  get rejectBtn() {
    return by.id(popUpModalLoc.rejectBtn)
  }

  get typeText() {
    return by.text(popUpModalLoc.type)
  }

  get approveTransactionTitle() {
    return by.text(popUpModalLoc.approveTransactionTitle)
  }

  get maximumNetworkFeeText() {
    return by.text(popUpModalLoc.maximumNetworkFee)
  }

  get balanceChangeText() {
    return by.text(popUpModalLoc.balanceChange)
  }

  get successfulToastMsg() {
    return by.text(popUpModalLoc.successfulToastMsg)
  }

  get network() {
    return by.text(popUpModalLoc.network)
  }

  get transactionDetail() {
    return by.text(popUpModalLoc.transactionDetails)
  }

  get feeAmount() {
    return by.text(popUpModalLoc.feeAmount)
  }

  get signMessage() {
    return by.text(popUpModalLoc.signMessage)
  }

  get account() {
    return by.text(popUpModalLoc.account)
  }

  get messageTitle() {
    return by.text(popUpModalLoc.messageTitle)
  }

  get scamTransaction() {
    return by.text(popUpModalLoc.scamTransaction)
  }

  get scamTransactionContent() {
    return by.text(popUpModalLoc.scamTransactionContent)
  }

  get rejectTransaction() {
    return by.text(popUpModalLoc.rejectTransaction)
  }

  get proceedAnyway() {
    return by.text(popUpModalLoc.proceedAnyway)
  }

  get switchToSepoliaNetwork() {
    return by.text(popUpModalLoc.switchToSepoliaNetwork)
  }

  get switchToFujiNetwork() {
    return by.text(popUpModalLoc.switchToFujiNetwork)
  }

  get createContact() {
    return by.text(popUpModalLoc.createContact)
  }

  get messageDetail() {
    return by.id(popUpModalLoc.messageDetail)
  }

  get popUpModalScrollView() {
    return by.id(popUpModalLoc.popUpModalScrollView)
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

  async verifyApproveTransactionItems() {
    await actions.waitForElement(this.approveTransactionTitle, 5000)
    await asserts.isVisible(this.network)
    await asserts.isVisible(this.transactionDetail)
    await asserts.isVisible(this.maximumNetworkFeeText)
    await asserts.isVisible(this.feeAmount)
    await asserts.isVisible(this.approveBtn)
    await asserts.isVisible(this.rejectBtn)
  }

  async verifyApproveTransactionScreen() {
    try {
      await sendPage.tapNextButton()
    } catch (e) {
      await actions.waitForElement(this.approveBtn, 10000)
    }
  }

  async verifyFeeIsLegit(isPXChain = false, estimatedGasFee = 0.009) {
    await actions.waitForElement(this.approveTransactionTitle, 10000)
    await actions.scrollToBottom(this.popUpModalScrollView)
    let tokenGasFee
    if (isPXChain) {
      tokenGasFee = await actions.getElementText(
        by.id(popUpModalLoc.tokenAmount),
        1
      )
    } else {
      tokenGasFee = await actions.getElementText(
        by.id(popUpModalLoc.tokenGasFee)
      )
    }
    console.log(`Current gas fee: ${tokenGasFee}`)
    const tokenMatch = tokenGasFee?.match(/[\d.]+/)
    const token = tokenMatch ? parseFloat(tokenMatch[0]) : 0
    assert(
      token > 0 && token <= estimatedGasFee,
      `currVal: ${token} !<= expectedVal: ${estimatedGasFee}`
    )
  }
}

export default new PopUpModalPage()
