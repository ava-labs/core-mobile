/* eslint-disable @typescript-eslint/explicit-function-return-type */
import commonEls from '../locators/commonEls.loc'
import Actions from '../helpers/actions'

class CommonElsPage {
  get backButton() {
    return by.id(commonEls.backButton)
  }

  get inputTextField() {
    return by.id(commonEls.inputTextField)
  }

  get simpleToastMsg() {
    return by.id(commonEls.simpleToastMsg)
  }

  get jailbrokenWarning() {
    return by.id(commonEls.jailbrokenWarning)
  }

  async tapBackButton() {
    await Actions.tap(this.backButton)
  }

  async enterTextInput(index: number, inputText: string) {
    await Actions.setInputText(this.inputTextField, inputText, index)
  }

  async waitForToastMsgGone(index?: number) {
    await Actions.waitForElementNotVisible(this.simpleToastMsg, 10, index)
  }

  async waitForJailbrokenWarning() {
    await Actions.waitForElement(this.jailbrokenWarning)
  }
}

export default new CommonElsPage()
