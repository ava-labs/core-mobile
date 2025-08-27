import Actions from '../helpers/actions'
import Assert from '../helpers/assertions'
import { Platform } from '../helpers/constants'
import delay from '../helpers/waits'
import swapTab from '../locators/swapTab.loc'
import commonElsPage from './commonEls.page'
import portfolioPage from './portfolio.page'
import selectTokenPage from './selectToken.page'
import watchlistPage from './track.page'

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

  get selectTokenTitleId() {
    return by.id(swapTab.selectTokenTitleId)
  }

  get selectTokenTitle() {
    return by.text(swapTab.selectTokenTitle)
  }

  get errorMsg() {
    return by.id(swapTab.errorMsg)
  }

  get youPay() {
    return by.text(swapTab.youPay)
  }

  get youReceive() {
    return by.text(swapTab.youReceive)
  }

  async tapAvaxToken() {
    return Actions.tapElementAtIndex(this.avaxToken, 0)
  }

  async tapUsdcToken() {
    return Actions.tapElementAtIndex(this.usdcToken, 0)
  }

  async tapSelectToken(index = 0) {
    await Actions.tapElementAtIndex(this.selectTokenTitle, index)
  }

  async tapReviewOrderButton(index = 0) {
    await Actions.waitForElement(this.reviewOrderBtn, 30000)
    while (await Actions.isVisible(this.reviewOrderBtn, index)) {
      await Actions.tapElementAtIndex(this.reviewOrderBtn, index)
      await delay(3000)
    }
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

  async enterAmountAndAdjust(amount: string) {
    await commonElsPage.enterAmount(amount)
    let tryCount = 5
    let newAmount = amount

    while (await Actions.isVisible(this.errorMsg, 0, 2000)) {
      newAmount = await this.adjustAmount(newAmount)
      await commonElsPage.enterAmount(newAmount)
      tryCount--
      if (
        (await Actions.isVisible(commonElsPage.nextButton, 0, 1000)) ||
        tryCount === 0
      ) {
        break
      }
    }
  }

  async swapOnTrack(index = 0, amount = '0.000001') {
    await watchlistPage.tapTrackBuyBtn(index)
    await commonElsPage.dismissTransactionOnboarding()
    await this.enterAmountAndAdjust(amount)
    await commonElsPage.tapNextButton()
    await commonElsPage.tapApproveButton()
    await commonElsPage.verifySuccessToast()
  }

  async tapYouPay() {
    try {
      await Actions.tap(this.youPay)
    } catch (e) {
      await this.tapSelectToken()
    }
  }

  async tapYouReceive() {
    try {
      await Actions.tap(this.youReceive)
    } catch (e) {
      await this.tapSelectToken()
    }
  }

  async swap(from: string, to: string, amount = '0.000001') {
    // Go to swap form
    await portfolioPage.tapSwap()
    await commonElsPage.dismissTransactionOnboarding()

    // Select From Token
    if (from !== 'AVAX') {
      await this.tapYouPay()
      await selectTokenPage.selectToken(from)
    }

    // Select To Token
    if (to !== 'USDC') {
      await this.tapYouReceive()
      await selectTokenPage.selectToken(to)
    }

    // Enter input
    await this.enterAmountAndAdjust(amount)
    await commonElsPage.tapNextButton()

    // If `from` is not AVAX, we need to approve the spend limit
    if (from !== 'AVAX') {
      try {
        await Actions.waitForElement(this.tokenSpendApproval, 10000)
        await commonElsPage.tapApproveButton()
        await commonElsPage.verifySuccessToast()
      } catch (e) {
        console.log('Spend limit approval is not needed')
      }
    }
    await commonElsPage.tapApproveButton()
  }

  async verifySwapScreen() {
    await Actions.waitForElement(this.swapTitle)
    await Actions.waitForElement(this.disabledReviewOrderBtn)
  }
}

export default new SwapTabPage()
