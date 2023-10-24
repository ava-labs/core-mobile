import Action from '../helpers/actions'
import analyticsConsentLoc from '../locators/analyticsConsent.loc'

class AnalyticsConsentPage {
  get noThanksBtn() {
    return by.text(analyticsConsentLoc.noThanksBtn)
  }

  get iAgreeBtn() {
    return by.text(analyticsConsentLoc.iAgreeBtn)
  }

  async tapNoThanksBtn() {
    await Action.tap(this.noThanksBtn)
  }

  async tapIAgreeBtn() {
    await Action.tap(this.iAgreeBtn)
  }
}

export default new AnalyticsConsentPage()
