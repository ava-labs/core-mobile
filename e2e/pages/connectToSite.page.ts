import Action from '../helpers/actions'
import connectToSiteLoc from '../locators/connectToSite.loc'

class ConnectToSite {
  get approveBtn() {
    return by.text(connectToSiteLoc.approveBtn)
  }

  get rejectBtn() {
    return by.id(connectToSiteLoc.rejectBtn)
  }

  async tapApproveBtn() {
    await Action.tap(this.approveBtn)
  }

  async tapRejectBtn() {
    await Action.tapElementAtIndex(this.rejectBtn, 0)
  }
}

export default new ConnectToSite()
