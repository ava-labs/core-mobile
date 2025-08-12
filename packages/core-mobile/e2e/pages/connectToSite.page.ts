import Action from '../helpers/actions'
import Assert from '../helpers/assertions'
import connectToSiteLoc from '../locators/connectToSite.loc'
import popUpModalPage from './popUpModal.page'

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

  get selectAccountsId() {
    return by.id(connectToSiteLoc.selectAccountsId)
  }

  get connectWalletTitle() {
    return by.text(connectToSiteLoc.connectWalletTitle)
  }

  async tapPlusIcon() {
    if (Action.platform() === 'ios') {
      await Action.tapElementAtIndex(this.plusIcon, 1)
    } else {
      await Action.tapElementAtIndex(this.plusIcon, 0)
    }
  }

  async tapApproveBtn() {
    try {
      await Action.tap(this.approveBtn)
    } catch (e) {
      await Action.tap(popUpModalPage.approveBtn)
    }
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
    await Action.tapElementAtIndex(this.selectAccountsId, 0)
  }

  async selectAccountAndconnect() {
    await Action.waitForElement(this.selectAccountsId, 30000)
    await Action.waitForElement(this.connectWalletTitle, 30000)
    await this.tapSelectAccounts()
    await this.tapAccountCheckBox()
    await this.tapApproveBtn()
  }

  async approveSignMessage(dapp: string) {
    await Action.waitForElement(this.signMessage)
    await Assert.isVisible(
      by.text(`${dapp} requests you to sign the following message`)
    )
    await this.tapApproveBtn()
  }
}

export default new ConnectToSite()
