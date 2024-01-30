import recoveryPhraseLoc from '../locators/existingRecoveryPhrase.loc'
import Action from '../helpers/actions'
import Assert from '../helpers/assertions'
import AnalyticsConsentPage from './analyticsConsent.page'
import CreatePinPage from './createPin.page'
import PortfolioPage from './portfolio.page'
import BottomTabsPage from './bottomTabs.page'
import commonElsPage from './commonEls.page'
import nameWalletPage from './nameWallet.page'
import accountManagePage from './accountManage.page'

class ExistingRecoveryPhrasePage {
  get recoveryPhraseTextInput() {
    return by.id(recoveryPhraseLoc.recoveryPhraseInput)
  }

  get signInWithRecoveryPhraseBtn() {
    return by.text(recoveryPhraseLoc.signInWithRecoveryPhrase)
  }

  get forgotPinBtn() {
    return by.text(recoveryPhraseLoc.forgotPinButton)
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

  async tapForgotPinBtn() {
    await Action.tap(this.forgotPinBtn)
  }

  async tapRecoveryPhraseBtn() {
    await Action.tap(this.recoveryPhrase)
  }

  async tapAlreadyHaveAWalletBtn() {
    await Action.tap(this.alreadyHaveAWalletBtn)
  }

  async tapSignInWithRecoveryPhraseBtn() {
    await Action.tap(this.signInWithRecoveryPhraseBtn)
  }

  async verifyExistingRecoveryPhrasePage() {
    await Assert.isVisible(this.recoveryPhraseTextInput)
    await Assert.isVisible(this.signInBtn)
    await Assert.isVisible(this.recoveryPhraseHeader)
    await Assert.isVisible(this.cancelButton)
  }

  async enterRecoveryPhrase(recoveryPhrase: string) {
    await Action.setInputText(this.recoveryPhraseTextInput, recoveryPhrase, 0)
  }

  async tapSignInBtn() {
    await Action.tap(this.signInBtn)
  }

  async recoverMnemonicWallet(recoveryPhrase: string) {
    // await this.tapForgotPinBtn()
    //await this.tapSignInWithRecoveryPhraseBtn()
    await this.tapAlreadyHaveAWalletBtn()
    await this.tapRecoveryPhraseBtn()
    await AnalyticsConsentPage.tapNoThanksBtn()
    await Action.waitForElement(this.recoveryPhraseTextInput)
    // await this.verifyExistingRecoveryPhrasePage()
    await this.enterRecoveryPhrase(recoveryPhrase)
    await this.tapSignInBtn()
    await nameWalletPage.enterWalletName('testWallet1\n')
    await Action.waitForElement(CreatePinPage.numpadOne)
    await CreatePinPage.tapNumpadZero()
    await CreatePinPage.tapNumpadZero()
    await CreatePinPage.tapAgreeAndContinueBtn()
    await commonElsPage.tapGetStartedButton()
    await Action.waitForElement(PortfolioPage.colectiblesTab)
    await PortfolioPage.verifyPorfolioScreen()
    await BottomTabsPage.verifyBottomTabs()
  }

  async recoverManualWallet() {
    await CreatePinPage.tapNumpadZero()
    await Action.waitForElement(PortfolioPage.colectiblesTab)
    await PortfolioPage.verifyPorfolioScreen()
    await BottomTabsPage.verifyBottomTabs()
    await commonElsPage.checkIfMainnet()
    await accountManagePage.checkAccountNameIsCorrect()
  }

  async recoverWallet(recoveryPhrase: string) {
    if (process.env.SEEDLESS_TEST === 'false') {
      await this.recoverMnemonicWallet(recoveryPhrase)
    } else {
      await this.recoverManualWallet()
    }
  }
}

export default new ExistingRecoveryPhrasePage()
