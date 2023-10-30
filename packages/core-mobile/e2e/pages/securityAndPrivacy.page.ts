import Actions from '../helpers/actions'
import securityAndPrivacyLoc from '../locators/securityAndPrivacy.loc'

class SecurityAndPrivacy {
  get connectedSites() {
    return by.text(securityAndPrivacyLoc.connectedSites)
  }

  async tapConnectedSites() {
    await Actions.tapElementAtIndex(this.connectedSites, 0)
  }
}

export default new SecurityAndPrivacy()
