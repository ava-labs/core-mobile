import onboardingLoc from '../locators/onboarding.loc'
import Assert from '../helpers/assertions'
import Action from '../helpers/actions'

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
    return by.id(onboardingLoc.accessExistingWallet)
  }

  get enterPinFirstScreenTitle() {
    return by.text(onboardingLoc.enterPinFirstScreenTitle)
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

  async verifyOnboardingPage() {
    await Assert.isVisible(this.continueWithGoogle)
    await Assert.isVisible(this.continueWithApple)
    await Assert.isVisible(this.manuallyCreateNewWallet)
    await Assert.isVisible(this.accessExistingWallet)
  }

  async tapAccessExistingWallet() {
    await Action.tap(this.accessExistingWallet)
  }

  async tapManuallyCreateNewWallet() {
    await Action.tap(this.manuallyCreateNewWallet)
  }
}

export default new OnboardingPage()
