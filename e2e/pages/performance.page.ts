import recoveryPhraseLoc from '../locators/existingRecoveryPhrase.loc'
import Action from '../helpers/actions'
import Assert from '../helpers/assertions'
import delay from '../helpers/waits'
import WatchlistPage from './watchlist.page'
import AnalyticsConsentPage from './analyticsConsent.page'
import CreatePinPage from './createPin.page'

class PerformanceTestingPage {
  get recoveryPhraseTextInput() {
    return by.id(recoveryPhraseLoc.recoveryPhraseInput)
  }

  get signInBtn() {
    return by.text(recoveryPhraseLoc.signInBtn)
  }

  get recoveryPhraseHeader() {
    return by.id(recoveryPhraseLoc.recoveryPhraseHeader)
  }

  get cancelButton() {
    return by.text(recoveryPhraseLoc.cancelButton)
  }

  get testWalletLink() {
    return by.id(recoveryPhraseLoc.testWalletLink)
  }

  async verifyExistingRecoveryPhrasePage() {
    await Assert.isVisible(this.recoveryPhraseTextInput)
    await Assert.isVisible(this.signInBtn)
    await Assert.isVisible(this.recoveryPhraseHeader)
    await Assert.isVisible(this.cancelButton)
  }

  async enterRecoveryPhrase(recoveryPhrase: string) {
    await Action.setInputText(this.recoveryPhraseTextInput, recoveryPhrase)
  }

  async tapSignInBtn() {
    await Action.tap(this.signInBtn)
  }

  async recoverWallet(recoveryPhrase: string) {
    const startTime = new Date().getTime()
    await WatchlistPage.tapWalletSVG()
    await AnalyticsConsentPage.tapNoThanksBtn()
    await this.enterRecoveryPhrase(recoveryPhrase)
    await this.tapSignInBtn()
    for (let i = 0; i < 12; i++) {
      await CreatePinPage.tapNumpadZero()
      await delay(500)
    }
    await CreatePinPage.tapEmptyCheckbox()
    await CreatePinPage.tapNextBtn()
    const endTime = await new Date().getTime()
    const elapsedTimeInSeconds = (endTime - startTime) / 1000
    return elapsedTimeInSeconds.toString()
  }
}

export default new PerformanceTestingPage()
