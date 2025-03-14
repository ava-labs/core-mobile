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
  get continueBtn() {
    return by.text(recoveryPhraseLoc.continueButton)
  }

  get recoveryPhraseTextInput() {
    return by.id(recoveryPhraseLoc.recoveryPhraseInput)
  }

  get signInWithRecoveryPhraseBtn() {
    return by.text(recoveryPhraseLoc.signInWithRecoveryPhrase)
  }

  get forgotPinBtn() {
    return by.text(recoveryPhraseLoc.forgotPinButton)
  }

  get import() {
    return by.text(recoveryPhraseLoc.import)
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

  get accessExistingWalletBtn() {
    return by.text(recoveryPhraseLoc.accessExistingWalletBtn)
  }

  get recoveryPhrase() {
    return by.text(recoveryPhraseLoc.recoveryPhrase)
  }

  get agreeAndContinue() {
    return by.text(recoveryPhraseLoc.agreeAndContinue)
  }

  get chooseWalletTitle() {
    return by.text(recoveryPhraseLoc.chooseWalletTitle)
  }

  get typeRecoveryPhraseBtn() {
    return by.text(recoveryPhraseLoc.typeRecoverPhaseBtn)
  }

  get createNewWalletBtn() {
    return by.text(recoveryPhraseLoc.createNewWalletBtn)
  }

  get manuallyCreateNewWalletBtn() {
    return by.id(recoveryPhraseLoc.manuallyCreateNewWalletBtn)
  }

  async tapManuallyCreateNewWallet() {
    await Action.tap(this.manuallyCreateNewWalletBtn)
  }

  async tapContinueBtn() {
    await Action.tap(this.continueBtn)
  }

  async tapForgotPinBtn() {
    await Action.tap(this.forgotPinBtn)
  }

  async tapRecoveryPhraseBtn() {
    await Action.tap(this.recoveryPhrase)
  }

  async tapAgreeAndContinue() {
    await Action.tap(this.agreeAndContinue)
  }

  async tapAlreadyHaveAWalletBtn() {
    await Action.tap(this.alreadyHaveAWalletBtn)
  }

  async tapAccessExistingWallet() {
    await Action.tap(this.accessExistingWalletBtn)
  }

  async tapSignInWithRecoveryPhraseBtn() {
    await Action.tap(this.signInWithRecoveryPhraseBtn)
  }

  async verifyExistingRecoveryPhrasePage() {
    await Assert.isVisible(this.recoveryPhraseTextInput)
    await Assert.isVisible(this.import)
    await Assert.isVisible(this.recoveryPhraseHeader)
    await Assert.isVisible(this.cancelButton)
  }

  async enterRecoveryPhrase(recoveryPhrase: string) {
    await Action.setInputText(this.recoveryPhraseTextInput, recoveryPhrase, 0)
  }

  async tapImport() {
    await Action.tap(this.import)
  }

  async recoverMnemonicWallet(recoveryPhrase: string) {
    await this.tapAccessExistingWallet()
    await this.tapRecoveryPhraseBtn()
    await AnalyticsConsentPage.tapNoThanksBtn()
    await Action.waitForElement(this.recoveryPhraseTextInput)
    await this.enterRecoveryPhrase(recoveryPhrase)
    await this.tapImport()
    await nameWalletPage.enterWalletName('testWallet1\n')
    await Action.waitForElement(CreatePinPage.numpadOne)
    await CreatePinPage.tapNumpadZero()
    await CreatePinPage.tapNumpadZero()
    await CreatePinPage.tapAgreeAndContinueBtn()
    await commonElsPage.tapGetStartedButton()
    await commonElsPage.tapNotNow()
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
    if (await Action.expectToBeVisible(this.forgotPinBtn)) {
      await this.recoverManualWallet()
    } else {
      await this.recoverMnemonicWallet(recoveryPhrase)
    }
  }

  async verifyChooseYourExistingWalletPage() {
    await Assert.isVisible(this.chooseWalletTitle)
    await Assert.isVisible(this.typeRecoveryPhraseBtn)
    await Assert.isVisible(this.createNewWalletBtn)
  }

  async tapTypeInRecoveryPhaseBtn() {
    await Action.tap(this.typeRecoveryPhraseBtn)
  }

  async tapCreateNewWalletBtn() {
    await Action.tap(this.createNewWalletBtn)
  }
}

export default new ExistingRecoveryPhrasePage()
