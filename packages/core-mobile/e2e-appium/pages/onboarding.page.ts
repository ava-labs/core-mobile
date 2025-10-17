/* eslint-disable prettier/prettier */
import { actions } from '../helpers/actions'
import { selectors } from '../helpers/selectors'
import onboardingLoc from '../locators/onboarding.loc'
import commonElsPage from './commonEls.page'

class OnboardingPage {
  get accessExistingWallet() {
    return selectors.getById(onboardingLoc.accessExistingWallet)
  }

  get chooseWalletTitle() {
    return selectors.getByText(onboardingLoc.chooseWalletTitle)
  }

  get typeInRecoveryPhase() {
    return selectors.getByText(onboardingLoc.typeRecoverPhase)
  }

  get recoveryPhraseInput() {
    return selectors.getById(onboardingLoc.recoveryPhraseInput)
  }

  get letsGo() {
    return selectors.getById(onboardingLoc.letsGo)
  }

  get unlockBtn() {
    return selectors.getByText(onboardingLoc.unlockBtn)
  }

  get agreeAndContinue() {
    return selectors.getByText(onboardingLoc.agreeAndContinue)
  }

  get import() {
    return selectors.getById(onboardingLoc.import)
  }

  get enterPinSecondScreenTitle() {
    return selectors.getByText(onboardingLoc.enterPinSecondScreenTitle)
  }

  get enterPinFirstScreenTitle() {
    return selectors.getByText(onboardingLoc.enterPinFirstScreenTitle)
  }

  get pinInputField() {
    return selectors.getById(onboardingLoc.pinInputField)
  }

  get nameWalletInput() {
    return selectors.getById(onboardingLoc.nameWalletInput)
  }

  get nameWalletNextBtn() {
    return selectors.getById(onboardingLoc.nameWalletNextBtn)
  }

  get nextBtnOnAvatarScreen() {
    return selectors.getById(onboardingLoc.nextBtnOnAvatarScreen)
  }

  get selectAvatarTitle() {
    return selectors.getByText(onboardingLoc.selectAvatarTitle)
  }

  get forgotPin() {
    return selectors.getByText(onboardingLoc.forgotPin)
  }

  get manuallyCreateNewWallet() {
    return selectors.getById(onboardingLoc.manuallyCreateNewWallet)
  }

  get noThanksBtn() {
    return selectors.getByText(onboardingLoc.noThanksBtn)
  }

  get newRecoveryPhraseTitle() {
    return selectors.getByText(onboardingLoc.newRecoveryPhraseTitle)
  }

  get updateAppModalTitle() {
    return selectors.getById(onboardingLoc.updateAppModalTitle)
  }

  get solanaLaunchTitle() {
    return selectors.getById(onboardingLoc.solanaLaunchTitle)
  }

  get grabber() {
    return selectors.getById(onboardingLoc.grabber)
  }

  get securityWarningContent() {
    return selectors.getByText(onboardingLoc.securityWarningContent)
  }

  get verifyYourRecoveryPhraseTitle() {
    return selectors.getByText(onboardingLoc.verifyYourRecoveryPhraseTitle)
  }

  async tapAccessExistingWallet() {
    await actions.tap(this.accessExistingWallet, this.typeInRecoveryPhase)
  }

  async tapTypeInRecoveryPhase() {
    await actions.tap(this.typeInRecoveryPhase, this.agreeAndContinue)
  }

  async exitMetro() {
    if (process.env.E2E || process.env.E2E_LOCAL_PATH) {
      console.log('you are using the e2e build, skipping metro dev menu')
    } else {
      try {
      console.log('you are using a dev build, skipping metro dev menu now...')
      const preceedingHost = driver.isIOS ? 'localhost' : '10.0.2.2'
      await actions.waitFor(selectors.getByText(`http://${preceedingHost}:8081`))
      await actions.tap(selectors.getByText(`http://${preceedingHost}:8081`))
      const dismissBtn = selectors.getByText("AvaxWallet")
      await actions.waitFor(dismissBtn, 30000)
      await actions.dragAndDrop(dismissBtn, [0, 1500])
      } catch (e) {
        console.log('Metro dev menu is not found...')
      }
    }
  }

  async exitMetroAfterLogin() {
    if (process.env.E2E !== 'true') {
      try {
        const dismissBtn = selectors.getByText("AvaxWallet")
        await actions.dragAndDrop(dismissBtn, [0, 200])
      } catch (e) {
        console.log('Metro dev menu is not found...')
      }
    }
  }

  async enterRecoveryPhrase(recoveryPhrase: string) {
    await actions.type(this.recoveryPhraseInput, recoveryPhrase)
    await actions.dismissKeyboard(onboardingLoc.recoveryPhraseInput)
  }

  async enterWalletName(walletName: string | undefined = undefined) {
    if (walletName) {
      await actions.type(this.nameWalletInput, walletName)
    }
    await actions.dismissKeyboard()
  }

  async tapNextBtnOnNameWallet() {
    await actions.tap(this.nameWalletNextBtn)
  }

  async tapNextBtnOnAvatarScreen() {
    await actions.delay(2000)
    await actions.tap(this.nextBtnOnAvatarScreen, this.letsGo)
  }

  async tapLetsGo() {
    await actions.tap(this.letsGo)
  }

  async tapUnlockBtn() {
    await actions.tap(this.unlockBtn, this.recoveryPhraseInput)
  }

  async tapAgreeAndContinue() {
    await actions.tap(this.agreeAndContinue, this.unlockBtn)
  }

  async tapImport() {
    await actions.tap(this.import, this.enterPinFirstScreenTitle)
  }

  async enterPin(pin = '000000') {
    await actions.waitFor(this.enterPinFirstScreenTitle)
    await this.tapZero(pin)
    await actions.waitFor(this.enterPinSecondScreenTitle)
    await this.tapZero(pin)
  }

  async tapZero(pin = '000000') {
    if (driver.isIOS) {
      await actions.type(this.pinInputField, pin)
    } else {
      await actions.tapNumberPad(pin)
    }
  }

  async dismissUpdateAppModal() {
    while (await actions.getVisible(this.updateAppModalTitle)) {
      await actions.delay(1000)
      await actions.dragAndDrop(this.updateAppModalTitle, [0, 1000])
      console.log('Dismissed update app modal')
    }
    await actions.delay(1000)
  }

  async dismissBottomSheet(element = this.grabber) {
    await actions.waitFor(element, 30000)
    await actions.dragAndDrop(element, [0, 500])
  }

async verifyLoggedIn(hasModal = false) {
    await actions.waitFor(commonElsPage.accountOne, 40000)
    if (hasModal) {
      await this.dismissUpdateAppModal()
    }
    console.log('Verified you are logged in')
  }

  async tapManuallyCreateNewWallet() {
    await actions.tap(this.manuallyCreateNewWallet, this.agreeAndContinue)
  }

  async tapNoThanksBtn() {
    await actions.tap(this.noThanksBtn)
  }

  async getMnemonicWords() {
    const mnemonicWords: string[] = []

    for (let i = 1; i <= 24; i++) {
      const word = (await actions.getText(
        selectors.getById(`mnemonic__${i}`)
      )) as string
      mnemonicWords.push(word)
    }
    return mnemonicWords
  }

  async dismissSecurityWarning() {
    if (driver.isAndroid) {
      await actions.waitForDisplayed(this.securityWarningContent)
      try {
        await actions.tap(commonElsPage.dismiss)
      } catch (e) {
        await actions.tap(commonElsPage.dismissAndroid)
      }
    }
  }

  async selectWord(words: string[], questionId: string) {
    const title = await actions.getText(selectors.getById(`${questionId}_title`))
    if (title) {
      const target = title.match(/"(.*?)"/)
      const targetIndex = target && target[1] ? words.indexOf(target[1]) : -1
      const isBefore = title.indexOf('before') > -1
      if (isBefore) {
        await actions.click(selectors.getById(`${questionId}_${words[targetIndex - 1]}`))
      } else {
        await actions.click(selectors.getById(`${questionId}_${words[targetIndex + 1]}`))
      }
    }
  }
}

export default new OnboardingPage()
