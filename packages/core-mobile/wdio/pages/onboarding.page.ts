/* eslint-disable prettier/prettier */
import { actions } from '../helpers/actions'
import { selectors } from '../helpers/selectors'
import onboardingLoc from '../locators/onboarding.loc'

class OnboardingPage {
  get accessExistingWallet() {
    return selectors.getByText(onboardingLoc.accessExistingWallet)
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
    return selectors.getById(onboardingLoc.agreeAndContinue)
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

  get forgotPin() {
    return selectors.getByText(onboardingLoc.forgotPin)
  }

  async tapAccessExistingWallet() {
    await actions.tap(this.accessExistingWallet)
  }

  async tapTypeInRecoveryPhase() {
    await actions.tap(this.typeInRecoveryPhase)
  }

  async exitMetro() {
    if (process.env.E2E !== 'true') {
      try {
      console.log('you are using a dev build, skipping metro dev menu now...')
      const preceedingHost = driver.isIOS ? 'localhost' : '10.0.2.2'
      await actions.waitFor(selectors.getByText(`http://${preceedingHost}:8081`))
      await actions.tap(selectors.getByText(`http://${preceedingHost}:8081`))
      const dismissBtn = selectors.getByText('This is the developer menu. It gives you access to useful tools in your development builds.')
      await actions.waitFor(dismissBtn, 10000)
      await actions.dragAndDrop(dismissBtn, [0, 1500])
      } catch (e) {
        console.log('Metro dev menu is not found...')
      }
    }
  }

  async exitMetroAfterLogin() {
    if (process.env.E2E !== 'true') {
      try {
      const dismissBtn = selectors.getBySomeText('This is the developer menu.')
      await actions.dragAndDrop(dismissBtn, [0, 200])
      } catch (e) {
        console.log('Metro dev menu is not found...')
      }
    }
  }

  async enterRecoveryPhrase(recoveryPhrase: string) {
    await actions.type(this.recoveryPhraseInput, recoveryPhrase)
    try {
      await actions.dismissKeyboard(onboardingLoc.recoveryPhraseInput)
    } catch (e) {
      console.warn('the keyboard is not displayed')
    }
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
    await actions.tap(this.nextBtnOnAvatarScreen)
  }

  async tapLetsGo() {
    await actions.tap(this.letsGo)
  }

  async tapUnlockBtn() {
    await actions.tap(this.unlockBtn)
  }

  async tapAgreeAndContinue() {
    await actions.tap(this.agreeAndContinue)
  }

  async tapImport() {
    await actions.tap(this.import)
  }

  async enterPin(pin = '000000') {
    await actions.waitFor(this.enterPinFirstScreenTitle)
    await this.tapZero(pin)
    await actions.waitFor(this.enterPinSecondScreenTitle)
    await this.tapZero(pin)
  }

  async dismissModals() {
    await this.dismissUpdateAppModal()
  }

  async tapZero(pin = '000000') {
    if (driver.isIOS) {
      await actions.type(this.pinInputField, pin)
    } else {
      await actions.tapNumberPad(pin)
    }
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

  async dismissUpdateAppModal() {
    try {
    await actions.waitFor(this.grabber, 30000)
    await actions.dragAndDrop(this.grabber, [0, 500])
  } catch (e) {
    console.log('Update app modal not found')
  }
  }

  async dismissBottomSheet(element = this.grabber) {
    await actions.waitFor(element, 30000)
    await actions.dragAndDrop(element, [0, 500])
  }

  async verifyLoggedIn(bottomSheetIsVisible = true) {
    if (bottomSheetIsVisible) {
      await this.dismissUpdateAppModal()
      await this.dismissBottomSheet(this.solanaLaunchTitle)
    }
  }
}

export default new OnboardingPage()
