import Actions from '../helpers/actions'
import PlusMenuLoc from '../locators/plusMenu.loc'

class PlusMenuPage {
  get sendButton() {
    return by.id(PlusMenuLoc.send)
  }

  async tapSendButton() {
    await Actions.tap(this.sendButton)
  }
}

export default new PlusMenuPage()
