import onboardingLoc from '../locators/onboarding.loc'
import Assert from '../helpers/assertions'
import Action from '../helpers/actions'
import delay from '../helpers/waits'
import commonElsPage from './commonEls.page'
import actions from '../helpers/actions'

class OnboardingPage {
  get continueWithGoogle() {
    return by.id(onboardingLoc.continueWithGoogle)
  }

  get continueWithApple() {
    return by.id(onboardingLoc.continueWithApple)
  }

  get manuallyCreateNewWallet() {
    return by.id(onboardingLoc.manuallyCreateNewWallet)
  }

  get accessExistingWallet() {
    return by.text(onboardingLoc.accessExistingWalletBtn)
  }

  get enterPinFirstScreenTitle() {
    return by.text(onboardingLoc.enterPinFirstScreenTitle)
  }

  get enterPinFirstScreenDescription() {
    return by.text(onboardingLoc.enterPinFirstScreenDescription)
  }

  get enterPinSecondScreenTitle() {
    return by.text(onboardingLoc.enterPinSecondScreenTitle)
  }

  get walletName() {
    return by.text(onboardingLoc.walletName)
  }

  get selectAvatarTitle() {
    return by.text(onboardingLoc.selectAvatarTitle)
  }

  get selectAvatarDescription() {
    return by.text(onboardingLoc.selectAvatarDescription)
  }

  get selectedAvatar() {
    return by.id(onboardingLoc.selectedAvatar)
  }

  get chooseWalletTitle() {
    return by.text(onboardingLoc.chooseWalletTitle)
  }

  get typeRecoveryPhraseBtn() {
    return by.text(onboardingLoc.typeRecoverPhase)
  }

  get createNewWalletBtn() {
    return by.text(onboardingLoc.createNewWalletBtn)
  }

  get analysticsTitle() {
    return by.text(onboardingLoc.analysticsTitle)
  }

  get analysticsContent() {
    return by.id(onboardingLoc.analysticsContentId)
  }

  get noThanksBtn() {
    return by.text(onboardingLoc.noThanksBtn)
  }

  get unlockBtn() {
    return by.text(onboardingLoc.unlockBtn)
  }

  get termsAndCondition() {
    return by.text(onboardingLoc.termsAndConditions)
  }

  get termsAndConditionsDescription() {
    return by.id(onboardingLoc.termsAndConditionsDescription)
  }

  get agreeAndContinue() {
    return by.text(onboardingLoc.agreeAndContinue)
  }

  get enterYourRecoveryPhraseTitle() {
    return by.text(onboardingLoc.enterYourRecoveryPhraseTitle)
  }

  get enterYourRecoveryPhraseDescription() {
    return by.text(onboardingLoc.enterYourRecoveryPhraseDescription)
  }

  get import() {
    return by.text(onboardingLoc.import)
  }

  get recoveryPhraseInput() {
    return by.id(onboardingLoc.recoveryPhraseInput)
  }

  get forgotPin() {
    return by.text(onboardingLoc.forgotPin)
  }

  get nameWalletInput() {
    return by.id(onboardingLoc.nameWalletInput)
  }

  get nameWalletTitle() {
    return by.text(onboardingLoc.nameWalletTitle)
  }

  get nameWalletContent() {
    return by.text(onboardingLoc.nameWalletContent)
  }

  get letsgo() {
    return by.id(onboardingLoc.letsgo)
  }

  get confirmationTitle() {
    return by.text(onboardingLoc.confirmationTitle)
  }

  get confirmationDescription() {
    return by.text(onboardingLoc.confirmationDescription)
  }

  get newRecoveryPhraseTitle() {
    return by.text(onboardingLoc.newRecoveryPhraseTitle)
  }

  get newRecoveryPhraseDescription() {
    return by.text(onboardingLoc.newRecoveryPhraseDescription)
  }

  get newRecoveryPhraseAlert() {
    return by.text(onboardingLoc.newRecoveryPhraseWarning)
  }

  get securityWarningTitle() {
    return by.text(onboardingLoc.securityWarningTitle)
  }

  get securityWarningContent() {
    return by.text(onboardingLoc.securityWarningContent)
  }

  get verifyYourRecoveryPhraseTitle() {
    return by.text(onboardingLoc.verifyYourRecoveryPhraseTitle)
  }

  get verifyYourRecoveryPhraseDescription() {
    return by.text(onboardingLoc.verifyYourRecoveryPhraseDescription)
  }

  async verifyOnboardingPage() {
    await Assert.isVisible(this.continueWithGoogle)
    await Assert.isVisible(this.continueWithApple)
    await Assert.isVisible(this.manuallyCreateNewWallet)
    await Assert.isVisible(this.accessExistingWallet)
  }

  async tapAccessExistingWallet() {
    await Action.waitForElement(this.accessExistingWallet, 20000)
    await Action.tap(this.accessExistingWallet)
  }

  async tapManuallyCreateNewWallet() {
    await Action.tap(this.manuallyCreateNewWallet)
  }

  async verifyChooseYourExistingWalletPage() {
    await Assert.isVisible(this.chooseWalletTitle)
    await Assert.isVisible(this.typeRecoveryPhraseBtn)
    await Assert.isVisible(this.createNewWalletBtn)
  }

  async tapTypeInRecoveryPhase() {
    await Action.tap(this.typeRecoveryPhraseBtn)
  }

  async tapCreateNewWalletBtn() {
    await Action.tap(this.createNewWalletBtn)
  }

  async tapNoThanksBtn() {
    await delay(2000)
    await Action.tapElementAtIndex(this.noThanksBtn, 0)
  }

  async tapUnlockBtn() {
    await Action.tap(this.unlockBtn)
  }

  async verifyAnalysticsContentPage() {
    await Action.waitForElement(this.noThanksBtn)
    await Assert.isVisible(this.analysticsTitle)
    await Assert.isVisible(this.analysticsContent)
    await Assert.isVisible(this.unlockBtn)
    await Assert.isVisible(this.noThanksBtn)
  }

  async verifyTermsAndConditionsPage() {
    await Action.waitForElement(this.termsAndCondition)
    await Assert.isVisible(this.termsAndConditionsDescription)
    await Assert.isVisible(this.agreeAndContinue)
  }

  async tapAgreeAndContinue() {
    await Action.tap(this.agreeAndContinue)
  }

  async enterRecoveryPhrase(recoveryPhrase: string) {
    await Action.setInputText(this.recoveryPhraseInput, recoveryPhrase, 0)
    await actions.dismissKeyboard()
  }

  async tapImport() {
    await Action.tap(this.import)
  }

  async verifyEnterYourRecoveryPhrasePage() {
    await Action.waitForElement(this.enterYourRecoveryPhraseTitle)
    await Assert.isVisible(this.enterYourRecoveryPhraseDescription)
    await Assert.isVisible(this.import)
  }

  async verifyEnterPinPage() {
    await Action.waitForElement(this.enterPinFirstScreenTitle)
    await Assert.isVisible(this.enterPinFirstScreenDescription)
  }

  async enterWalletName(walletName: string) {
    await Action.waitForElement(this.nameWalletInput)
    await element(this.nameWalletInput).replaceText(walletName)
  }

  async verifyNameYourWalletPage() {
    await Action.waitForElement(this.nameWalletTitle)
    await Assert.isVisible(this.nameWalletContent)
    await Assert.isVisible(this.nameWalletInput)
    await Assert.isVisible(commonElsPage.next)
  }

  async verifySelectAvatarPage() {
    await Action.waitForElement(this.selectAvatarTitle)
    await Assert.isVisible(this.selectAvatarDescription)
    await Assert.isVisible(this.selectedAvatar)
  }

  async verifyConfirmationPage() {
    await Action.waitForElement(this.confirmationTitle)
    await Assert.isVisible(this.confirmationDescription)
    await Assert.isVisible(this.selectedAvatar)
    await Assert.isVisible(this.letsgo)
  }
  async tapLetsGo() {
    await Action.waitForElement(this.letsgo)
    await Action.longPress(this.letsgo)
  }

  async verifyNewRecoveryPhrasePage() {
    await Action.waitForElement(this.newRecoveryPhraseTitle)
    await Assert.isVisible(this.newRecoveryPhraseDescription)
    await Assert.isVisible(this.newRecoveryPhraseAlert)
    await Assert.isVisible(commonElsPage.copyPhrase)
    await commonElsPage.tapCopyPhrase()
    await Action.waitForElement(commonElsPage.copied)
  }

  async getMnemonicWords() {
    const mnemonicWords: string[] = []

    for (let i = 1; i <= 24; i++) {
      const word = (await Action.getElementText(
        by.id(`mnemonic__${i}`)
      )) as string
      mnemonicWords.push(word)
    }
    return mnemonicWords
  }

  async verifySecurityWarning() {
    await Action.waitForElement(this.securityWarningTitle)
    await Assert.isVisible(this.securityWarningContent)
    await Action.tap(commonElsPage.dismiss)
  }

  async verifySelectPhrasePage() {
    await Action.waitForElement(this.verifyYourRecoveryPhraseTitle)
    await Assert.isVisible(this.verifyYourRecoveryPhraseDescription)
    await Assert.isVisible(commonElsPage.next)
  }

  async selectWord(words: string[], questionId: string) {
    const title = await Action.getElementText(by.id(`${questionId}_title`))
    if (title) {
      const target = title.match(/"(.*?)"/)
      const targetIndex = target && target[1] ? words.indexOf(target[1]) : -1
      const isBefore = title.indexOf('before') > -1
      if (isBefore) {
        await Action.tap(by.id(`${questionId}_${words[targetIndex - 1]}`))
      } else {
        await Action.tap(by.id(`${questionId}_${words[targetIndex + 1]}`))
      }
    }
  }
}

export default new OnboardingPage()
