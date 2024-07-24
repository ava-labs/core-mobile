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

  get signMessage() {
    return by.text(connectToSiteLoc.signMessage)
  }

  get accountCheckBox() {
    return by.id(connectToSiteLoc.accountCheckBox)
  }

  get selectAccounts() {
    return by.text(connectToSiteLoc.selectAccounts)
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

  async tapAccountCheckBox(index = 0) {
    await Action.tapElementAtIndex(this.accountCheckBox, index)
  }

  async tapSelectAccounts() {
    await Action.tapElementAtIndex(this.selectAccounts, 0)
  }

  async selectAccountAndconnect(toastMessage: string) {
    await Action.waitForElement(this.selectAccounts, 8000)
    await this.tapSelectAccounts()
    await this.tapAccountCheckBox()
    await this.tapApproveBtn()
    await Action.waitForElementNoSync(by.text(`Connected to ${toastMessage}`))
  }

  async approveSignMessage(dapp: string) {
    await Action.waitForElement(this.signMessage, 5000)
    await Assert.isVisible(
      by.text(`${dapp} requests you to sign the following message`)
    )
    await this.tapApproveBtn()
  }
}

export default new ConnectToSite()
