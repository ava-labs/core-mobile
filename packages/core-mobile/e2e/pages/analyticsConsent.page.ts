import Action from '../helpers/actions'
import delay from '../helpers/waits'
import analyticsConsentLoc from '../locators/analyticsConsent.loc'

class AnalyticsConsentPage {
  get noThanksBtn() {
    return by.text(analyticsConsentLoc.noThanksBtn)
  }

  get iAgreeBtn() {
    return by.text(analyticsConsentLoc.iAgreeBtn)
  }

  async tapNoThanksBtn() {
    await delay(2000)
    await Action.tapElementAtIndex(this.noThanksBtn, 0)
  }

  async tapIAgreeBtn() {
    await Action.tap(this.iAgreeBtn)
  }
}

export default new AnalyticsConsentPage()
