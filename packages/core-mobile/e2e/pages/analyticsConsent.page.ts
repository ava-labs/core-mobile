import Action from '../helpers/actions'
import Assert from '../helpers/assertions'
import delay from '../helpers/waits'
import analyticsConsentLoc from '../locators/analyticsConsent.loc'

class AnalyticsConsentPage {
  get analysticsTitle() {
    return by.text(analyticsConsentLoc.analysticsTitle)
  }

  get analysticsContent() {
    return by.id(analyticsConsentLoc.analysticsContentId)
  }

  get noThanksBtn() {
    return by.text(analyticsConsentLoc.noThanksBtn)
  }

  get unlockBtn() {
    return by.text(analyticsConsentLoc.unlockBtn)
  }

  async tapNoThanksBtn() {
    await delay(2000)
    await Action.tapElementAtIndex(this.noThanksBtn, 0)
  }

  async tapUnlockBtn() {
    await Action.tap(this.unlockBtn)
  }

  async verifyAnalysticsContentPage() {
    await Assert.isVisible(this.analysticsTitle)
    await Assert.isVisible(this.analysticsContent)
    await Assert.isVisible(this.unlockBtn)
    await Assert.isVisible(this.noThanksBtn)
  }

}

export default new AnalyticsConsentPage()
