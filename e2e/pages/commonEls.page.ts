import commonEls from '../locators/commonEls.loc'
import Action from '../helpers/actions'

class CommonElsPage {
  get backButton() {
    return by.id(commonEls.backButton)
  }

  async tapBackButton() {
    await Action.tap(this.backButton)
  }
}

export default new CommonElsPage()
