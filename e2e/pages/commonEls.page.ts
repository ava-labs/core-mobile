import commonEls from '../locators/commonEls.loc'
import Actions from '../helpers/actions'

class CommonElsPage {
  get backButton() {
    return by.id(commonEls.backButton)
  }

  get inputTextField() {
    return by.id(commonEls.inputTextField)
  }

  async tapBackButton() {
    await Actions.tap(this.backButton)
  }

  async enterTextInput(index: number, inputText: string) {
    await Actions.setInputText(this.inputTextField, inputText, index)
  }
}

export default new CommonElsPage()
