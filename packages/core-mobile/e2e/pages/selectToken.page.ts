import actions from '../helpers/actions'
import selectTokenLoc from '../locators/selectToken.loc'
import commonElsPage from './commonEls.page'

class selectTokenPage {
  get title() {
    return by.text(selectTokenLoc.title)
  }

  async selectToken(tokenName: string) {
    await actions.setInputText(commonElsPage.searchBar, tokenName)
    await actions.tapElementAtIndex(by.id(`token_selector__${tokenName}`), 0)
  }
}

export default new selectTokenPage()
