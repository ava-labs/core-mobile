import Actions from '../helpers/actions'
import ReceiveLoc from '../locators/browser.loc'

class ReceiveAddressPage {
  get searchBar() {
    return by.id(ReceiveLoc.searchBar)
  }

  async tapSearchBar() {
    await Actions.tapElementAtIndex(this.searchBar, 0)
  }

  async enterBrowserSearchQuery(query: string) {
    await Actions.setInputText(this.searchBar, query)
    await element(this.searchBar).tapReturnKey()
  }
}

export default new ReceiveAddressPage()
