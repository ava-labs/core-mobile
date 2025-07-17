import assert from 'assert'
import Action from '../helpers/actions'
import AccountManagePage from '../pages/accountManage.page'
import Assert from '../helpers/assertions'
import activityTab from '../locators/activityTab.loc'
import { Platform } from '../helpers/constants'
import ReviewAndSend from '../pages/reviewAndSend.page'
import PortfolioPage from '../pages/portfolio.page'
import loginRecoverWallet from '../helpers/loginRecoverWallet'
import BottomsTabsPage from '../pages/bottomTabs.page'

const platformIndex = Action.platform() === Platform.iOS ? 1 : 0

class ActivityTabPage {
  get arrowSVG() {
    return by.id(activityTab.arrowUpSVG)
  }

  get networkIcon() {
    return by.id(activityTab.networkIcon)
  }

  get transaction() {
    return by.text(activityTab.transaction)
  }

  get activityListItem() {
    return by.id(activityTab.activityListItem)
  }

  get activityListItemAmount() {
    return by.id(activityTab.activityListItemAmount)
  }

  get bridgeActivityListItem() {
    return by.id(activityTab.bridgeActivityListItem)
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

  get linkSVG() {
    return by.id(activityTab.linkIcon)
  }

  get noRecentActivity() {
    return by.text(activityTab.noRecentActivity)
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

  async tapBridgeFilterOption() {
    await Action.tapElementAtIndex(this.bridgeFilterOption, platformIndex)
  }

  async verifySelectedFilter(filter: string) {
    await Action.waitForElement(this.selectFilterDropdown)
    await Assert.hasText(this.selectFilterDropdown, `Display: ${filter}`)
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

  async verifyActivityRow(
    newRow:
      | Detox.IosElementAttributes
      | Detox.AndroidElementAttributes
      | undefined,
    text: string
  ) {
    if (newRow === undefined) {
      fail('The new row is not added to activity tab')
    } else {
      assert(newRow.label?.includes(text))
    }
  }

  async verifyTransactionDetailWebBrowser(transactionType: string) {
    await this.tapNetworkIcon(0)
    await Assert.isNotVisible(by.text(transactionType))
    await Assert.isNotVisible(AccountManagePage.accountsDropdown)
    await Assert.isNotVisible(BottomsTabsPage.plusIcon)
    if (transactionType === 'Send') {
      await Action.waitForElementNotVisible(
        ReviewAndSend.sendSuccessfulToastMsg
      )
    }
  }

  async exitTransactionDetailWebBrowser(transactionType: string) {
    if (device.getPlatform() === 'android') {
      await device.pressBack()
      await Assert.isVisible(AccountManagePage.accountsDropdown)
      await Assert.isVisible(by.text(transactionType))
    } else {
      await device.launchApp({ newInstance: true })
      await loginRecoverWallet.login()
      await Assert.isVisible(PortfolioPage.colectiblesTab)
      await Assert.isVisible(PortfolioPage.assetsTab)
      await Assert.isVisible(PortfolioPage.defiTab)
    }
    await Assert.isVisible(BottomsTabsPage.plusIcon)
  }

  async getLatestActivityRow() {
    await Action.waitForElement(this.activityListItem)
    const newRow = await Action.getAttributes(this.activityListItem)
    return 'elements' in newRow ? newRow.elements[0] : newRow
  }

  async getLatestActivityRowAmount() {
    const newRow = await Action.getAttributes(this.activityListItemAmount)
    return 'elements' in newRow ? newRow.elements[0] : newRow
  }

  async verifyNewRow(type: string, amount: string) {
    await Action.waitForElement(this.activityListItem)
    const typeEle = await this.getLatestActivityRow()
    const amountEle = await this.getLatestActivityRowAmount()
    await this.verifyActivityRow(typeEle, type)
    await this.verifyActivityRow(amountEle, amount)
  }

  async verifyExistingRow(
    type: string,
    amount: string | undefined = undefined
  ) {
    await Action.waitForElement(this.activityListItem)
    await Action.waitForElement(by.text(type))
    if (amount) await Action.waitForElement(by.text(amount))
  }
}

export default new ActivityTabPage()
