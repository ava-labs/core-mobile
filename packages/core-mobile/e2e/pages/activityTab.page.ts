import Action from '../helpers/actions'
import AccountManagePage from '../pages/accountManage.page'
import Assert from '../helpers/assertions'
import activityTab from '../locators/activityTab.loc'
import delay from '../helpers/waits'
import { Platform } from '../helpers/constants'
import ReviewAndSend from '../pages/reviewAndSend.page'
import PortfolioPage from '../pages/portfolio.page'
import TransactionDetailsPage from '../pages/transactionDetails.page'
import commonElsPage from './commonEls.page'

const platformIndex = Action.platform() === Platform.iOS ? 1 : 0

class ActivityTabPage {
  get address() {
    return by.id(activityTab.address)
  }

  get arrowSVG() {
    return by.id(activityTab.arrowSVG)
  }

  get transaction() {
    return by.text(activityTab.transaction)
  }

  get activityDetail() {
    return by.id(activityTab.activityDetail)
  }

  get activityListHeader() {
    return by.id(activityTab.activityHeader)
  }

  get selectFilterDropdown() {
    return by.id(activityTab.currentFilter)
  }

  get bridgeFilterOption() {
    return by.id(activityTab.filterOptionBridge)
  }

  get contractCallFilterOption() {
    return by.id(activityTab.filterOptionContractCall)
  }

  get outgoingFilterOption() {
    return by.id(activityTab.filterOptionOutgoing)
  }

  get incomingFilterOption() {
    return by.id(activityTab.filterOptionIncoming)
  }

  get bridgeTransactionItem() {
    return by.id(activityTab.bridgeTransaction)
  }

  get bridgeSVG() {
    return by.id(activityTab.bridgeSVG)
  }

  get headerBack() {
    return by.id(activityTab.headerBack)
  }

  get linkSVG() {
    return by.id(activityTab.linkIcon)
  }

  async tapArrowIcon(index: number) {
    await Action.tapElementAtIndex(this.arrowSVG, index)
  }

  async refreshActivityPage() {
    await Action.swipeDown(by.id('arrow_svg'), 'slow', 0.75, 0)
  }

  async tapTransaction() {
    await Action.tapElementAtIndex(this.transaction, 2)
  }

  async tapFilterDropdown() {
    await Action.tap(this.selectFilterDropdown)
  }

  async tapHeaderBack() {
    await device.pressBack()
  }

  async tapBridgeFilterOption() {
    await Action.tapElementAtIndex(this.bridgeFilterOption, platformIndex)
  }

  async tapContractCallFilterOption() {
    await Action.tapElementAtIndex(this.contractCallFilterOption, platformIndex)
  }

  async tapIncomingFilterOption() {
    await Action.tapElementAtIndex(this.incomingFilterOption, platformIndex)
  }

  async tapOutgingFilterOption() {
    await Action.tapElementAtIndex(this.outgoingFilterOption, platformIndex)
  }

  async tapOutgoingFilterOption() {
    await Action.tapElementAtIndex(this.incomingFilterOption, platformIndex)
  }

  async tapBridgeIcon() {
    await Action.tapElementAtIndex(this.bridgeSVG, 1)
  }

  async verifyIncomingTransaction(transactionValue: string) {
    if (Action.platform() === 'ios') {
      await commonElsPage.tapBackButton()
    } else {
      await device.pressBack()
    }
    if (Action.platform() === 'ios') {
      await AccountManagePage.tapAccountDropdownTitle()
    }
    const firstAccountAddress = await AccountManagePage.getFirstAvaxAddress()
    if (Action.platform() === 'android') {
      await AccountManagePage.tapAccountDropdownTitle()
    }
    await AccountManagePage.tapSecondAccount()
    await PortfolioPage.tapAvaxNetwork()
    await PortfolioPage.tapActivityTab()
    await this.tapArrowIcon(0)
    const isTransactionSuccessful =
      await TransactionDetailsPage.isDateTextOlderThan(300)
    console.log(isTransactionSuccessful)
    await Assert.hasText(this.address, firstAccountAddress)
    await Assert.hasText(this.activityDetail, transactionValue)
  }

  async verifyOutgoingTransaction(
    waitTime: number,
    secondAccountAddress: string,
    transactionValue: string
  ) {
    await Action.waitForElementNotVisible(ReviewAndSend.sendSuccessfulToastMsg)
    await delay(waitTime)
    await this.refreshActivityPage()
    await this.tapArrowIcon(0)
    await TransactionDetailsPage.isDateTextOlderThan(300)
    await Assert.hasText(this.address, secondAccountAddress)
    await Assert.hasText(this.activityDetail, transactionValue)
  }
}

export default new ActivityTabPage()
