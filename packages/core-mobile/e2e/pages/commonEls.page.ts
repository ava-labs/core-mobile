import commonEls from '../locators/commonEls.loc'
import Actions from '../helpers/actions'

class CommonElsPage {
  get retryBtn() {
    return by.text(commonEls.retryBtn)
  }

  get backButton() {
    return by.id(commonEls.backButton)
  }

  get getStartedButton() {
    return by.text(commonEls.getStartedBtn)
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

  async tapGetStartedButton() {
    await Actions.tap(this.getStartedButton)
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

  async tapRetryBtn() {
    await Actions.waitForElement(this.retryBtn, 1)
    try {
      await Actions.tap(this.retryBtn)
    } catch (error) {
      /* empty */
    }
  }
}

export default new CommonElsPage()
