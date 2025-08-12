import CreatePinPage from '../pages/createPin.page'
import commonElsPage from '../pages/commonEls.page'
import Actions from '../helpers/actions'
import onboardingPage from '../pages/onboarding.page'
import onboardingLoc from '../locators/onboarding.loc'
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
    // we had to enable sync on `tapNext()` because the app is not working with the desync mode
    await commonElsPage.tapNext(true)
    await onboardingPage.tapLetsGo()
    await commonElsPage.verifyLoggedIn()
  }

  async enterPin() {
    await CreatePinPage.tapNumpadZero6Times()
    await commonElsPage.checkIfMainnet()
  }

  async loggedIn() {
    if (process.env.REUSE === 'true') {
      console.log('REUSE is true, skipping the onboarding process')
      await commonElsPage.enterPin()
      await commonElsPage.verifyLoggedIn(false)
      return true
    } else {
      return false
    }
  }

  async login(recoverPhrase = ENV.E2E_MNEMONIC as string) {
    const isLoggedIn = await this.loggedIn()
    if (!isLoggedIn) {
      await this.recoverMnemonicWallet(recoverPhrase)
    }
  }
}

export default new LoginRecoverWallet()
