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

  async logged() {
    const loggedin = await Actions.isVisible(onboardingPage.forgotPin)
    try {
      if (loggedin) {
        await commonElsPage.enterPin()
      }
      await bottomTabsPage.verifyBottomTabs(false)
      return true
    } catch (e) {
      console.log('Pin is not required...')
      return false
    }
  }

  async login(recoverPhrase = ENV.E2E_MNEMONIC as string) {
    const isLoggedIn = await this.logged()
    if (!isLoggedIn) {
      await this.recoverMnemonicWallet(recoverPhrase)
    }
  }
}

export default new LoginRecoverWallet()
