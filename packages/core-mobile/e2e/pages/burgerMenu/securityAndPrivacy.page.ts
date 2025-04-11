import Actions from '../../helpers/actions'

import burgerMenuPage from './burgerMenu.page'

class SecurityAndPrivacy {
  get connectedSites() {
    return by.text('Connected Sites')
  }

  async tapConnectedSites() {
    await Actions.tapElementAtIndex(this.connectedSites, 0)
  }

  async goToConnectedSites() {
    await burgerMenuPage.tapBurgerMenuButton()
    await burgerMenuPage.tapSecurityAndPrivacy()
    await this.tapConnectedSites()
  }
}

export default new SecurityAndPrivacy()
