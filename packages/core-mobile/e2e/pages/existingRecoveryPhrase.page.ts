import recoveryPhraseLoc from '../locators/existingRecoveryPhrase.loc'
import Action from '../helpers/actions'
import Assert from '../helpers/assertions'
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

  get alreadyHaveAWalletBtn() {
    return by.text(recoveryPhraseLoc.alreadyHaveAWalletBtn)
  }

  get recoveryPhrase() {
    return by.text(recoveryPhraseLoc.recoveryPhrase)
  }

  async tapRecoveryPhraseBtn() {
    await Action.tap(this.recoveryPhrase)
  }

  async tapAlreadyHaveAWalletBtn() {
    await Action.tap(this.alreadyHaveAWalletBtn)
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
    await this.tapAlreadyHaveAWalletBtn()
    await this.tapRecoveryPhraseBtn()
    await AnalyticsConsentPage.tapNoThanksBtn()
    await Action.waitForElement(this.recoveryPhraseTextInput)
    await this.verifyExistingRecoveryPhrasePage()
    await this.enterRecoveryPhrase(recoveryPhrase)
    await this.tapSignInBtn()
    await Action.waitForElement(CreatePinPage.numpadOne)
    await CreatePinPage.tapNumpadZero()
    await CreatePinPage.tapNumpadZero()
    await CreatePinPage.tapEmptyCheckbox()
    await CreatePinPage.tapNextBtn()
    await Action.waitForElement(PortfolioPage.colectiblesTab)
    await PortfolioPage.verifyPorfolioScreen()
    await BottomTabsPage.verifyBottomTabs()
  }
}

export default new ExistingRecoveryPhrasePage()
