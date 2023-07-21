import Action from '../helpers/actions'
import connectToSiteLoc from '../locators/connectToSite.loc'

class ConnectToSite {
  get approveBtn() {
    return by.text(connectToSiteLoc.approveBtn)
  }

  get rejectBtn() {
    return by.id(connectToSiteLoc.rejectBtn)
  }

  get selectAccountsDropdown() {
    return by.text(connectToSiteLoc.selectAccountDropdown)
  }

  get plusIcon() {
    return by.id(connectToSiteLoc.plusButton)
  }

  async tapPlusIcon() {
    if (Action.platform() === 'ios') {
      await Action.tapElementAtIndex(this.plusIcon, 1)
    } else {
      await Action.tapElementAtIndex(this.plusIcon, 0)
    }
  }

  async tapApproveBtn() {
    await Action.tap(this.approveBtn)
  }

  async tapRejectBtn() {
    await Action.tapElementAtIndex(this.rejectBtn, 0)
  }

  async tapSelectAccountsDropdown() {
    await Action.tapElementAtIndex(this.selectAccountsDropdown, 0)
  }
}

export default new ConnectToSite()
