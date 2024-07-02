import onboardingLoc from '../locators/onboarding.loc'
import Assert from '../helpers/assertions'

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

  async verifyOnboardingPage() {
    await Assert.isVisible(this.continueWithGoogle)
    await Assert.isVisible(this.continueWithApple)
    await Assert.isVisible(this.manuallyCreateNewWallet)
    await Assert.isVisible(this.accessExistingWallet)
  }
}

export default new OnboardingPage()
