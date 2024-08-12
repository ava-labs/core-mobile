import Actions from '../helpers/actions'
import Asserts from '../helpers/assertions'
import connectedSitesLoc from '../locators/connectedSites.loc'
import burgerMenuPage from './burgerMenu/burgerMenu.page'

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

  get backBtn() {
    return by.id(connectedSitesLoc.backBtn)
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

  async verifyDapp(dapp: string) {
    await Asserts.isVisible(this.dappAvatar)
    await Actions.waitForElement(by.text(dapp))
  }

  async disconnectDapp(dApp: string) {
    await Actions.waitForElementNoSync(by.id(`x_btn__${dApp}`), 4000)
    await Actions.tapElementAtIndex(by.id(`x_btn__${dApp}`), 0)
  }

  async verifyEmtpyConnectedSites() {
    await Asserts.isVisible(this.connectedSitesTitle)
    await Asserts.isVisible(this.noConnectedSitesText)
    await Asserts.isVisible(this.noConnectedSitesContent)
    await Asserts.isVisible(this.addNewConnection)
  }

  async goBackToPortfolio() {
    await burgerMenuPage.tapBackbutton()
    await burgerMenuPage.tapBackbutton()
    await burgerMenuPage.swipeLeft()
  }
}

export default new ConnectedSites()
