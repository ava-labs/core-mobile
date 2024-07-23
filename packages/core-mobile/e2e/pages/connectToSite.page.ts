import Action from '../helpers/actions'
import Assert from '../helpers/assertions'
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

  async selectAccountAndconnect(toastMessage: string) {
    await Action.waitForElement(by.text('Select Accounts'), 8000)
    await Action.tap(by.text('Select Accounts'))
    await Action.tapElementAtIndex(by.id('account_check_box'), 0)
    await Action.tap(by.text('Approve'))
    await Action.waitForElementNoSync(by.text(`Connected to ${toastMessage}`))
  }

  async approveSignMessage(dapp: string) {
    await Action.waitForElement(by.text('Sign Message'), 5000)
    await Assert.isVisible(
      by.text(`${dapp} requests you to sign the following message`)
    )
    await Action.tap(by.text('Approve'))
  }
}

export default new ConnectToSite()
