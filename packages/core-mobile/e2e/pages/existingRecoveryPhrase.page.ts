import recoveryPhraseLoc from '../locators/existingRecoveryPhrase.loc'
import Action from '../helpers/actions'
import Assert from '../helpers/assertions'
import WatchlistPage from './watchlist.page'
import AnalyticsConsentPage from './analyticsConsent.page'
import CreatePinPage from './createPin.page'
import PortfolioPage from './portfolio.page'
import BottomTabsPage from './bottomTabs.page'

class ExistingRecoveryPhrasePage {
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
    await WatchlistPage.tapWalletSVG()
    await AnalyticsConsentPage.tapNoThanksBtn()
    const startTime = new Date().getTime()
    await Action.waitForElement(this.recoveryPhraseTextInput)
    const endTime = new Date().getTime()
    await Action.reportUIPerformance(
      startTime,
      endTime,
      'performanceRecoveryPhraseScreen',
      1,
      3
    )
    await this.verifyExistingRecoveryPhrasePage()
    await this.enterRecoveryPhrase(recoveryPhrase)
    await this.tapSignInBtn()
    const startTime2 = new Date().getTime()
    await Action.waitForElement(CreatePinPage.numpadOne)
    const endTime2 = new Date().getTime()
    await Action.reportUIPerformance(
      startTime2,
      endTime2,
      'performanceRecoveryCreatePinScreen',
      1,
      3
    )
    await CreatePinPage.tapNumpadZero()
    await CreatePinPage.tapNumpadZero()
    await CreatePinPage.tapEmptyCheckbox()
    await CreatePinPage.tapNextBtn()
    const startTime3 = new Date().getTime()
    await Action.waitForElement(PortfolioPage.colectiblesTab)
    const endTime3 = new Date().getTime()
    await Action.reportUIPerformance(
      startTime3,
      endTime3,
      'performancePortfolioScreen',
      1,
      3
    )
    await PortfolioPage.verifyPorfolioScreen()
    await BottomTabsPage.verifyBottomTabs()
  }
}

export default new ExistingRecoveryPhrasePage()
