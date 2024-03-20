import Actions from '../helpers/actions'
import BrowserLoc from '../locators/browser.loc'

class BrowserPage {
  get searchBar() {
    return by.id(BrowserLoc.searchBar)
  }

  async tapSearchBar() {
    await Actions.tapElementAtIndex(this.searchBar, 0)
  }

  async enterBrowserSearchQuery(query: string) {
    await Actions.setInputText(this.searchBar, query)
    await element(this.searchBar).tapReturnKey()
  }
}

export default new BrowserPage()
