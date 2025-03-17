import CreatePinPage from '../pages/createPin.page'
import AnalyticsConsentPage from '../pages/analyticsConsent.page'
import PortfolioPage from '../pages/portfolio.page'
import commonElsPage from '../pages/commonEls.page'
import nameWalletPage from '../pages/nameWallet.page'
import existingRecoveryPhrasePage from '../pages/existingRecoveryPhrase.page'
import Actions from '../helpers/actions'
import onboardingPage from '../pages/onboarding.page'
import onboardingLoc from '../locators/onboarding.loc'

class LoginRecoverWallet {
  async recoverMnemonicWallet() {
    const recoveryPhrase: string = process.env.E2E_MNEMONIC as string
    await existingRecoveryPhrasePage.tapAccessExistingWallet()
    await existingRecoveryPhrasePage.tapRecoveryPhraseBtn()
    await existingRecoveryPhrasePage.tapAgreeAndContinue()
    await AnalyticsConsentPage.tapUnlockBtn()
    await existingRecoveryPhrasePage.enterRecoveryPhrase(recoveryPhrase)
    await existingRecoveryPhrasePage.tapImport()
    await Actions.waitForElement(onboardingPage.enterPinFirstScreenTitle)
    await CreatePinPage.setPinNumber()
    await Actions.waitForElement(onboardingPage.enterPinSecondScreenTitle)
    await CreatePinPage.setPinNumber()
    await nameWalletPage.enterWalletName(onboardingLoc.walletName)
    await CreatePinPage.tapNextBtn()
    await Actions.waitForElement(onboardingPage.selectAvatarTitle)
    await CreatePinPage.tapNextBtn()
    await CreatePinPage.tapLetsGo()
    await PortfolioPage.verifyNavTabs()
  }

  async enterPin() {
    await CreatePinPage.tapNumpadOne()
    await commonElsPage.checkIfMainnet()
  }

  async recoverWalletLogin() {
    const isLoggedIn = await Actions.expectToBeVisible(
      existingRecoveryPhrasePage.forgotPinBtn
    )

    if (isLoggedIn) {
      await CreatePinPage.tapNumpadZero()
    } else {
      await this.recoverMnemonicWallet()
    }
  }
}

export default new LoginRecoverWallet()
