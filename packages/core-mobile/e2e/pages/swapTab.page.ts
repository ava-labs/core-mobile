import Actions from '../helpers/actions'
import Assert from '../helpers/assertions'
import { Platform } from '../helpers/constants'
import delay from '../helpers/waits'
import swapTab from '../locators/swapTab.loc'
import bottomTabsPage from './bottomTabs.page'
import plusMenuPage from './plusMenu.page'
import popUpModalPage from './popUpModal.page'
import sendPage from './send.page'

const platformIndex = Actions.platform() === Platform.Android ? 1 : 0

class SwapTabPage {
  get avaxToken() {
    return by.text(swapTab.avaxToken)
  }

  get usdcToken() {
    return by.text(swapTab.usdcToken)
  }

  get fromText() {
    return by.text(swapTab.from)
  }

  get toastMessage() {
    return by.text(swapTab.toastMessage)
  }

  get linkSvg() {
    return by.id(swapTab.linkSvg)
  }

  get reviewOrderBtn() {
    return by.id(swapTab.reviewOrderBtn)
  }

  get disabledReviewOrderBtn() {
    return by.id(swapTab.disabledReviewOrderBtn)
  }

  get approveBtn() {
    return by.id(swapTab.approveBtn)
  }

  get rejectBtn() {
    return by.id(swapTab.rejectBtn)
  }

  get amountField() {
    return by.id(swapTab.amountField)
  }

  get tokenSpendApproval() {
    return by.text(swapTab.tokenSpendApproval)
  }

  get swapTitle() {
    return by.text(swapTab.swapTitle)
  }

  get fromTokenSelector() {
    return by.id(swapTab.fromTokenSelector)
  }

  get toTokenSelector() {
    return by.id(swapTab.toTokenSelector)
  }

  async tapAvaxToken() {
    return Actions.tapElementAtIndex(this.avaxToken, 0)
  }

  async tapUsdcToken() {
    return Actions.tapElementAtIndex(this.usdcToken, 0)
  }
  async tapFromTokenSelector() {
    await Actions.tapElementAtIndex(this.fromTokenSelector, 0)
  }

  async tapToTokenSelector() {
    await Actions.tapElementAtIndex(this.toTokenSelector, 0)
  }

  async tapReviewOrderButton(index = 0) {
    await Actions.waitForElementNoSync(this.reviewOrderBtn, 30000)
    while (await Actions.isVisible(this.reviewOrderBtn, index)) {
      await Actions.tapElementAtIndex(this.reviewOrderBtn, index)
      await delay(3000)
    }
  }

  async tapApproveButton() {
    await Actions.waitForElement(this.approveBtn, 10000)
    delay(2000)
    await Actions.tapElementAtIndex(this.approveBtn, 0)
  }

  async tapRejectButton() {
    await Actions.tapElementAtIndex(this.rejectBtn, 0)
  }

  async tapLink() {
    await Actions.tapElementAtIndex(this.linkSvg, 0)
  }

  async inputTokenAmmountAvax() {
    await Actions.setInputText(
      this.amountField,
      swapTab.tokenValueAvax,
      platformIndex
    )
    await Actions.tap(this.fromText)
  }

  async inputTokenAmount(amount: string) {
    await Actions.clearTextInput(this.amountField, 0)
    await Actions.setInputText(this.amountField, amount, 0)
    await Actions.tap(this.fromText)
  }

  async verifyToastMessageItems() {
    await Assert.isVisible(this.toastMessage)
    await Assert.isVisible(this.linkSvg)
  }

  async adjustAmount(amount: string) {
    return (parseFloat(amount) * 10).toFixed(10).replace(/\.?0+$/, '')
  }

  async swap(from: string, to: string, amount = '0.000001') {
    // Go to swap form
    await bottomTabsPage.tapPlusIcon()
    await plusMenuPage.tapSwapButton()

    // Select From Token
    await this.tapFromTokenSelector()
    await sendPage.selectToken(from)

    // Select To Token
    await this.tapToTokenSelector()
    await sendPage.selectToken(to)

    // Enter input
    await this.inputTokenAmount(amount)
    let newAmount = amount

    // Update input if error message is displayed
    while (
      (await Actions.isVisible(by.id('error_msg'), 0, 500)) ||
      (await Actions.hasText(this.amountField, ''))
    ) {
      newAmount = await this.adjustAmount(newAmount)
      console.log(newAmount)
      await this.inputTokenAmount(newAmount)
      if (await Actions.isVisible(this.reviewOrderBtn, 0, 1000)) {
        break
      }
    }
    // Tap Review Order
    await this.tapReviewOrderButton()

    // Approve token spend approval
    await Actions.waitForElement(popUpModalPage.popUpModalScrollView, 30000)
    if (await Actions.isVisible(this.tokenSpendApproval, 0)) {
      await popUpModalPage.verifyFeeIsLegit(true, false, 0.2)
      await this.tapApproveButton()
    }
    // Verify fee and approve
    await popUpModalPage.verifyFeeIsLegit(true, false, 0.2)
    await this.tapApproveButton()
  }

  async verifySwapScreen() {
    await Actions.waitForElement(this.swapTitle)
    await Actions.waitForElement(this.disabledReviewOrderBtn)
  }
}

export default new SwapTabPage()
