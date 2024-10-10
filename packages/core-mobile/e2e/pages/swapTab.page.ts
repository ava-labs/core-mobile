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
  get selectTokenDropdown() {
    return by.text(swapTab.selectTokenDropdown)
  }

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

  async tapAvaxToken() {
    return Actions.tapElementAtIndex(this.avaxToken, 0)
  }

  async tapUsdcToken() {
    return Actions.tapElementAtIndex(this.usdcToken, 0)
  }

  async tapSelectTokenDropdown() {
    await Actions.tapElementAtIndex(this.selectTokenDropdown, 0)
  }

  async tapReviewOrderButton(index = 0) {
    await Actions.waitForElementNoSync(this.reviewOrderBtn, 8000)
    await Actions.tapElementAtIndex(this.reviewOrderBtn, index)
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
    await Actions.setInputText(this.amountField, amount, 0)
    await Actions.tap(this.fromText)
  }

  async verifyToastMessageItems() {
    await Assert.isVisible(this.toastMessage)
    await Assert.isVisible(this.linkSvg)
  }

  async swap(from: string, to: string, amount = '0.00001') {
    await bottomTabsPage.tapPlusIcon()
    await plusMenuPage.tapSwapButton()
    await this.tapSelectTokenDropdown()
    await sendPage.selectToken(from)
    await this.inputTokenAmount(amount)
    await this.tapSelectTokenDropdown()
    await sendPage.selectToken(to)
    await this.tapReviewOrderButton()
    try {
      await Actions.waitForElement(this.tokenSpendApproval, 5000)
      await this.tapApproveButton()
    } catch (e) {
      console.error('Token spend approval not found')
    }
    await popUpModalPage.verifyFeeIsLegit(false, 0.2)
    await this.tapApproveButton()
  }

  async verifySwapScreen() {
    await Actions.waitForElement(this.swapTitle)
    await Actions.waitForElement(this.selectTokenDropdown)
    await Actions.waitForElement(this.disabledReviewOrderBtn)
  }
}

export default new SwapTabPage()
