import assert from 'assert'
import actions from '../helpers/actions'
import asserts from '../helpers/assertions'
import popUpModalLoc from '../locators/popupModal.loc'
import { fetchCChainBaseFee } from '../helpers/networksFee'
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

  get approveExport() {
    return by.text(popUpModalLoc.approveExportTitle)
  }

  get approveImport() {
    return by.text(popUpModalLoc.approveImportTitle)
  }

  get addDelegator() {
    return by.text(popUpModalLoc.addDelegator)
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

  get switchToSepoliaNetworkTitle() {
    return by.text(popUpModalLoc.switchToSepoliaNetworkTitle)
  }

  get switchToFujiNetworkTitle() {
    return by.text(popUpModalLoc.switchToFujiNetworkTitle)
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

  get rejectTextBtn() {
    return by.text(popUpModalLoc.rejectTextBtn)
  }

  get successToast() {
    return by.id(popUpModalLoc.successToast)
  }

  async tapApproveBtn() {
    await actions.waitForElement(this.popUpModalScrollView, 40000)
    await actions.tapElementAtIndex(this.approveBtn, 0)
  }

  async tapRejectBtn() {
    try {
      await actions.waitForElement(this.rejectBtn, 5000)
      await actions.tap(this.rejectBtn)
    } catch (e) {
      await actions.waitForElement(this.rejectTextBtn, 5000)
      await actions.tap(this.rejectTextBtn)
    }
  }

  async verifyExportDetail(from: string, to: string) {
    await actions.waitForElement(this.approveExport, 30000)
    await actions.waitForElement(by.id('Transaction Type_Export'))
    await actions.waitForElement(by.id(`Source Chain_Avalanche ${from}-Chain`))
    await actions.waitForElement(by.id(`Target Chain_Avalanche ${to}-Chain`))
  }

  async verifyImportDetail(from: string, to: string) {
    await actions.waitForElement(this.approveImport, 30000)
    await actions.waitForElement(by.id('Transaction Type_Import'))
    await actions.waitForElement(by.id(`Source Chain_Avalanche ${from}-Chain`))
    await actions.waitForElement(
      by.id(`Destination Chain_Avalanche ${to}-Chain`)
    )
  }

  async verifyDelegatorDetail() {
    await actions.waitForElement(this.addDelegator, 50000)
    await actions.waitForElement(by.text('Stake Amount'))
    await actions.waitForElement(by.text('Staking Details'))
  }

  async verifySignMessageModal() {
    await actions.waitForElement(this.signMessage, 50000)
    await asserts.isVisible(this.network)
    await asserts.isVisible(this.approveBtn)
    await asserts.isVisible(this.rejectBtn)
  }

  async verifyScamAlertedSignMessageModal() {
    await this.verifySignMessageModal()
    await actions.waitForElement(this.scamTransaction)
    await asserts.isVisible(this.scamTransactionContent)
  }

  async switchToSepoliaNetwork() {
    await actions.waitForElement(this.switchToSepoliaNetworkTitle, 50000)
    await asserts.isVisible(this.rejectBtn)
    await actions.tap(this.approveBtn)
  }

  async switchToFujiNetwork() {
    await actions.waitForElement(this.switchToFujiNetworkTitle, 50000)
    await asserts.isVisible(this.rejectBtn)
    await actions.tap(this.approveBtn)
  }

  async verifyScamTransactionModal() {
    await actions.waitForElement(this.scamTransaction, 50000)
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

  async verifyApproveTransactionScreen() {
    try {
      await sendPage.tapNextButton()
    } catch (e) {
      await actions.waitForElement(this.approveBtn, 10000)
    }
  }

  async verifySuccessToast() {
    await actions.waitForElement(this.successToast, 20000)
  }

  async verifyFeeIsLegit(
    isCChain = true,
    isPXChain = false,
    estimatedGasFee = 0.009
  ) {
    // Wait for pop up modal displayed and scroll to bottom
    await actions.waitForElement(this.popUpModalScrollView, 30000)
    await actions.scrollToBottom(this.popUpModalScrollView)

    // Get token network fee
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

    // Verify network fee is not over the estimated gas fee
    console.log(`Current network fee: ${tokenGasFee}`)
    const tokenMatch = tokenGasFee?.match(/[\d.]+/)
    const token = tokenMatch ? parseFloat(tokenMatch[0]) : 0
    assert(
      token > 0 && token <= estimatedGasFee,
      `currVal: ${token} !<= expectedVal: ${estimatedGasFee}`
    )

    // Verify base fee for C-Chain
    if (isCChain) {
      const tolerance = 3
      const baseFeeByApi = parseFloat(await fetchCChainBaseFee())
      const slowBaseFeeUI = parseFloat(
        (await actions.getElementText(by.id(popUpModalLoc.slowBaseFee))) || '0'
      )
      const customBaseFeeUI = parseFloat(
        (await actions.getElementText(by.id(popUpModalLoc.customBaseFee))) ||
          '0'
      )

      // Calculate percentage differences
      const diffSlow = Math.abs(baseFeeByApi - slowBaseFeeUI)
      const diffCustom = Math.abs(baseFeeByApi - customBaseFeeUI)

      console.log(
        `Current base fee for C-Chain: API - ${baseFeeByApi} UI - ${slowBaseFeeUI}, diff - ${diffSlow}`
      )
      // BaseFee by API should be within the tolerance of the slow and custom base fee
      assert(
        diffSlow <= tolerance,
        `API Base Fee: ${baseFeeByApi}, Slow Base Fee: ${slowBaseFeeUI} -  diff - ${diffSlow} > ${tolerance})`
      )

      assert(
        diffCustom <= tolerance,
        `API Base Fee: ${baseFeeByApi}, Custom Base Fee: ${customBaseFeeUI} -  diff - ${diffCustom} > ${tolerance}`
      )
    }
  }
}

export default new PopUpModalPage()
