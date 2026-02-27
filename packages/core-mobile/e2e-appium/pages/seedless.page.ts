import { actions } from '../helpers/actions'
import { selectors } from '../helpers/selectors'
import seedlessLoc from '../locators/seedless.loc'
import onboardingPage from './onboarding.page'

class SeedlessPage {
  get continueWithGoogle() {
    return selectors.getById(seedlessLoc.continueWithGoogle)
  }

  get continueWithApple() {
    return selectors.getById(seedlessLoc.continueWithApple)
  }

  get agreeAndContinueBtn() {
    return selectors.getById(seedlessLoc.agreeAndContinueBtn)
  }

  get addRecoveryMethodsSkip() {
    return selectors.getById(seedlessLoc.addRecoveryMethodsSkip)
  }

  get analyticsUnlock() {
    return selectors.getById(seedlessLoc.analyticsUnlock)
  }

  get analyticsNoThanks() {
    return selectors.getById(seedlessLoc.analyticsNoThanks)
  }

  async tapContinueWithGoogle() {
    await actions.tap(this.continueWithGoogle)
  }

  async tapContinueWithApple() {
    await actions.tap(this.continueWithApple)
  }

  async tapGoogleAccountIfVisible() {
    const email = process.env.E2E_GOOGLE_EMAIL
    if (!email) return

    try {
      const accountElement = await selectors.getBySomeText(email)
      const visible = await actions.getVisible(accountElement)
      if (visible) {
        await actions.tap(accountElement)
      }
    } catch {
      // Account picker may not show (e.g. one-tap) or different UI
    }
  }

  async waitForTermsAndContinue() {
    await actions.waitFor(this.agreeAndContinueBtn, 60000)
    await actions.tap(this.agreeAndContinueBtn)
  }

  async tapSkipRecoveryMethods() {
    await actions.waitFor(this.addRecoveryMethodsSkip, 10000)
    await actions.tap(this.addRecoveryMethodsSkip)
  }

  async tapAnalyticsNoThanks() {
    await actions.waitFor(this.analyticsNoThanks, 10000)
    await actions.tap(this.analyticsNoThanks)
  }

  async completeSeedlessOnboarding() {
    await onboardingPage.exitMetro()
    await this.tapContinueWithGoogle()
    await actions.delay(3000)
    await this.tapGoogleAccountIfVisible()
    await actions.delay(5000)
    await this.waitForTermsAndContinue()
    await this.tapSkipRecoveryMethods()
    await this.tapAnalyticsNoThanks()
    await onboardingPage.enterPin()
    await onboardingPage.enterWalletName()
    await onboardingPage.tapNextBtnOnNameWallet()
    await onboardingPage.tapNextBtnOnAvatarScreen()
    await onboardingPage.tapLetsGo()
    await onboardingPage.verifyLoggedIn()
  }
}

export default new SeedlessPage()
