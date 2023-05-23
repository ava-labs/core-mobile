import Action from '../helpers/actions'
import activityTab from '../locators/activityTab.loc'
import { Platform } from '../helpers/constants'

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
    await Action.tapElementAtIndex(this.headerBack, 0)
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

  async tapOutgoingFilterOption() {
    await Action.tapElementAtIndex(this.incomingFilterOption, platformIndex)
  }

  async tapBridgeIcon() {
    await Action.tapElementAtIndex(this.bridgeSVG, 1)
  }
}

export default new ActivityTabPage()
