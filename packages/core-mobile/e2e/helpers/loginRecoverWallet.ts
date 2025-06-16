import CreatePinPage from '../pages/createPin.page'
import commonElsPage from '../pages/commonEls.page'
import Actions from '../helpers/actions'
import onboardingPage from '../pages/onboarding.page'
import onboardingLoc from '../locators/onboarding.loc'
import bottomTabsPage from '../pages/bottomTabs.page'
import { ENV } from './getEnvs'

class LoginRecoverWallet {
  async recoverMnemonicWallet(recoveryPhrase: string) {
    await onboardingPage.tapAccessExistingWallet()
    await onboardingPage.tapTypeInRecoveryPhase()
    await onboardingPage.tapAgreeAndContinue()
    await onboardingPage.tapUnlockBtn()
    await onboardingPage.enterRecoveryPhrase(recoveryPhrase)
    await onboardingPage.tapImport()
    await Actions.waitForElement(onboardingPage.enterPinFirstScreenTitle)
    await commonElsPage.enterPin()
    await Actions.waitForElement(onboardingPage.enterPinSecondScreenTitle)
    await commonElsPage.enterPin()
    await onboardingPage.enterWalletName(onboardingLoc.walletName)
    await Actions.tap(onboardingPage.nameWalletTitle)
    await commonElsPage.tapNext()
    await Actions.waitForElement(onboardingPage.selectAvatarTitle)
    await commonElsPage.tapNext()
    await onboardingPage.tapLetsGo()
    await bottomTabsPage.verifyBottomTabs()
  }

  async enterPin() {
    await CreatePinPage.tapNumpadZero6Times()
    await commonElsPage.checkIfMainnet()
  }

  async login(recoverPhrase = ENV.E2E_MNEMONIC as string) {
    const isLoggedIn = await Actions.expectToBeVisible(onboardingPage.forgotPin)

    if (isLoggedIn) {
      await commonElsPage.enterPin()
      await bottomTabsPage.verifyBottomTabs()
    } else {
      await this.recoverMnemonicWallet(recoverPhrase)
    }
  }
}

export default new LoginRecoverWallet()
