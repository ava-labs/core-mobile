import assert from 'assert'
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

  get networkIcon() {
    return by.id(activityTab.networkIcon)
  }

  get transaction() {
    return by.text(activityTab.transaction)
  }

  get activityListHeader() {
    return by.id(activityTab.activityHeader)
  }

  get activityListItem() {
    return by.id(activityTab.activityListItem)
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

  async tapNetworkIcon(index: number) {
    await Action.tapElementAtIndex(this.networkIcon, index)
  }

  async refreshActivityPage() {
    await Action.swipeDown(by.id('activity_tab'), 'slow', 0.25, 0)
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

  async verifyIncomingTransaction() {
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
  }

  async verifyOutgoingTransaction(
    waitTime: number,
    secondAccountAddress: string
  ) {
    await Action.waitForElementNotVisible(ReviewAndSend.sendSuccessfulToastMsg)
    await delay(waitTime)
    await this.refreshActivityPage()
    await this.tapArrowIcon(0)
    await TransactionDetailsPage.isDateTextOlderThan(300)
    await Assert.hasText(this.address, secondAccountAddress)
  }

  async verifyActivityRow(
    newRow:
      | Detox.IosElementAttributes
      | Detox.AndroidElementAttributes
      | undefined,
    activity_type: string
  ) {
    if (newRow === undefined) {
      fail('The new row is not added to activity tab')
    } else {
      assert(newRow.label?.includes(activity_type))
    }
  }

  async verifyTransactionDetailWebBrowser() {
    if (device.getPlatform() === 'android') {
      await device.disableSynchronization()
      await this.tapNetworkIcon(0)
      await device.pressBack()
    } else {
      await this.tapNetworkIcon(0)
    }
    await delay(5000)
    await Action.waitForElementNotVisible(ReviewAndSend.sendSuccessfulToastMsg)
    await Assert.isNotVisible(AccountManagePage.accountsDropdown)
    await Assert.isNotVisible(by.text('Send'))
    await Assert.isNotVisible(by.id('add_svg'))
  }
  async getLatestActivityRow() {
    await delay(5000)
    await this.refreshActivityPage()
    const newRow = await Action.getAttributes(this.activityListItem)
    return 'elements' in newRow ? newRow.elements[0] : newRow
  }
}

export default new ActivityTabPage()
