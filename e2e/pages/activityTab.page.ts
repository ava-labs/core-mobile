import Action from '../helpers/actions'
import activityTab from '../locators/activityTab.loc'

class ActivityTabPage {
  get transaction() {
    return by.text(activityTab.transaction)
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

  get incomingFilterOption() {
    return by.id(activityTab.filterOptionIncoming)
  }

  get bridgeTransactionItem() {
    return by.id(activityTab.bridgeTransaction)
  }

  get bridgeSVG() {
    return by.id(activityTab.bridgeSVG)
  }

  get arrowSVG() {
    return by.id(activityTab.arrowSVG)
  }

  get linkSVG() {
    return by.id(activityTab.linkIcon)
  }

  get usdCoinTransaction() {
    return by.text(activityTab.usdCoin)
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

  async tapBridgeFilterOption() {
    await Action.tapElementAtIndex(
      this.bridgeFilterOption,
      Action.platformIndex
    )
  }

  async tapContractCallFilterOption() {
    await Action.tapElementAtIndex(
      this.contractCallFilterOption,
      Action.platformIndex
    )
  }

  async tapIncomingFilterOption() {
    await Action.tapElementAtIndex(
      this.incomingFilterOption,
      Action.platformIndex
    )
  }

  async tapOutgoingFilterOption() {
    await Action.tapElementAtIndex(
      this.incomingFilterOption,
      Action.platformIndex
    )
  }

  async tapBridgeIcon() {
    await Action.tapElementAtIndex(this.bridgeSVG, 1)
  }

  async tapUsdCoinTransaction() {
    await Action.tapElementAtIndex(this.usdCoinTransaction, 1)
  }
}

export default new ActivityTabPage()
