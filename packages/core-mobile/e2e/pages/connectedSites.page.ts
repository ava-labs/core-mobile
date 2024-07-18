import Actions from '../helpers/actions'
import Asserts from '../helpers/assertions'
import connectedSitesLoc from '../locators/connectedSites.loc'

class ConnectedSites {
  get dappAvatar() {
    return by.id(connectedSitesLoc.dappAvatar)
  }

  get manageBtn() {
    return by.text(connectedSitesLoc.manageBtn)
  }

  get emptyChkBox() {
    return by.id(connectedSitesLoc.emptyChkBox)
  }

  get deleteBtn() {
    return by.text(connectedSitesLoc.deleteBtn)
  }

  get coreDapp() {
    return by.id(connectedSitesLoc.coreDapp)
  }

  get noConnectedSitesText() {
    return by.text(connectedSitesLoc.noConnectedSites)
  }

  get noConnectedSitesContent() {
    return by.text(connectedSitesLoc.noConnectedSitesContent)
  }

  get connectedSitesTitle() {
    return by.text(connectedSitesLoc.title)
  }

  get addNewConnection() {
    return by.text(connectedSitesLoc.addNewConnection)
  }

  async tapManageBtn() {
    await Actions.tapElementAtIndex(this.manageBtn, 0)
  }

  async tapSelectAllChkBox() {
    await Actions.tapElementAtIndex(this.emptyChkBox, 0)
  }

  async tapDeleteBtn() {
    await Actions.tapElementAtIndex(this.deleteBtn, 0)
  }

  async verifyCoreDapp() {
    await Asserts.isVisible(this.coreDapp)
    await Asserts.isVisible(this.dappAvatar)
  }

  async disconnectDapp(dApp: string) {
    await Actions.tapElementAtIndex(by.id(`x_btn__${dApp}`), 0)
  }

  async verifyEmtpyConnectedSites() {
    await Asserts.isVisible(this.connectedSitesTitle)
    await Asserts.isVisible(this.noConnectedSitesText)
    await Asserts.isVisible(this.noConnectedSitesContent)
    await Asserts.isVisible(this.addNewConnection)
  }
}

export default new ConnectedSites()
