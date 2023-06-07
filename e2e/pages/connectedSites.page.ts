import Actions from '../helpers/actions'
import connectedSitesLoc from '../locators/connectedSites.loc'

class ConnectedSites {
  get traderJoe() {
    return by.text(connectedSitesLoc.traderJoe)
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

  async tapManageBtn() {
    await Actions.tapElementAtIndex(this.manageBtn, 0)
  }

  async tapSelectAllChkBox() {
    await Actions.tapElementAtIndex(this.emptyChkBox, 0)
  }

  async tapDeleteBtn() {
    await Actions.tapElementAtIndex(this.deleteBtn, 0)
  }
}

export default new ConnectedSites()
