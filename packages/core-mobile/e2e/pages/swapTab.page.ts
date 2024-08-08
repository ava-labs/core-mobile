import Actions from '../helpers/actions'
import Assert from '../helpers/assertions'
import { Platform } from '../helpers/constants'
import swapTab from '../locators/swapTab.loc'
import bottomTabsPage from './bottomTabs.page'
import plusMenuPage from './plusMenu.page'

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

  get approveBtn() {
    return by.id(swapTab.approveBtn)
  }

  get rejectBtn() {
    return by.id(swapTab.rejectBtn)
  }

  get amountField() {
    return by.id(swapTab.amountField)
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

  async reviewOrderButton() {
    await Actions.tapElementAtIndex(this.reviewOrderBtn, 0)
  }

  async waitForReviewOrderBtnEnabled() {
    await Actions.waitForCondition(
      async () => {
        const attr = await Actions.getAttributes(this.amountField, 1)
        if ('elements' in attr) {
          return attr.elements[1]?.text
        } else {
          return attr.text
        }
      },
      (text: string | undefined) => text && text.length > 0
    )
  }

  async tapApproveButton() {
    await Actions.waitForElement(this.approveBtn)
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
    await Actions.tap(by.text(from))
    await this.inputTokenAmount(amount)
    await this.tapSelectTokenDropdown()
    await Actions.tap(by.text(to))
    await this.waitForReviewOrderBtnEnabled()
    await this.reviewOrderButton()
    await this.tapApproveButton()
  }
}

export default new SwapTabPage()
