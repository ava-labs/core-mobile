import actions from '../helpers/actions'
import asserts from '../helpers/assertions'
import approveTransactionLoc from '../locators/approveTransaction.loc'

class ApproveTransactionPage {
  get toastMessage() {
    return by.text(approveTransactionLoc.toastMessage)
  }

  get linkSvg() {
    return by.id(approveTransactionLoc.linkSvg)
  }

  get approveBtn() {
    return by.id(approveTransactionLoc.approveBtn)
  }

  get rejectBtn() {
    return by.id(approveTransactionLoc.rejectBtn)
  }

  get typeText() {
    return by.text(approveTransactionLoc.type)
  }

  get accountText() {
    return by.text(approveTransactionLoc.account)
  }

  get approveTransactionTitle() {
    return by.text(approveTransactionLoc.approveTransactionTitle)
  }

  get maximumNetworkFeeText() {
    return by.text(approveTransactionLoc.maximumNetworkFee)
  }

  get balanceChangeText() {
    return by.text(approveTransactionLoc.balanceChange)
  }

  get accountNumberText() {
    return by.text(approveTransactionLoc.accountNumber)
  }

  get successfulToastMsg() {
    return by.text(approveTransactionLoc.successfulToastMsg)
  }

  get network() {
    return by.text(approveTransactionLoc.network)
  }

  get transactionDetail() {
    return by.text(approveTransactionLoc.transactionDetails)
  }

  get feeAmount() {
    return by.text(approveTransactionLoc.feeAmount)
  }

  async tapApproveBtn() {
    await actions.tap(this.approveBtn)
  }

  async tapRejectBtn() {
    await actions.tap(this.rejectBtn)
  }

  async verifyApproveTransactionItems() {
    await actions.waitForElement(this.approveTransactionTitle)
    await asserts.isVisible(this.network)
    await asserts.isVisible(this.transactionDetail)
    await asserts.isVisible(this.maximumNetworkFeeText)
    await asserts.isVisible(this.feeAmount)
    await asserts.isVisible(this.approveBtn)
    await asserts.isVisible(this.rejectBtn)
  }
}

export default new ApproveTransactionPage()
