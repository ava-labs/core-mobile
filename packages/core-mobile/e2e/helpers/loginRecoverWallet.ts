import CreatePinPage from '../pages/createPin.page'
import AnalyticsConsentPage from '../pages/analyticsConsent.page'
import PortfolioPage from '../pages/portfolio.page'
import commonElsPage from '../pages/commonEls.page'
import nameWalletPage from '../pages/nameWallet.page'
import ExistingRecoveryPhrasePage from '../pages/existingRecoveryPhrase.page'
import accountManagePage from '../pages/accountManage.page'

class LoginRecoverWallet {
  async recoverMnemonicWallet() {
    const recoveryPhrase: string = process.env.E2E_MNEMONIC as string
    await ExistingRecoveryPhrasePage.tapAlreadyHaveAWalletBtn()
    await ExistingRecoveryPhrasePage.tapRecoveryPhraseBtn()
    await AnalyticsConsentPage.tapNoThanksBtn()
    await ExistingRecoveryPhrasePage.enterRecoveryPhrase(recoveryPhrase)
    await ExistingRecoveryPhrasePage.tapSignInBtn()
    await nameWalletPage.enterWalletName('testWallet1\n')
    await CreatePinPage.tapNumpadZero()
    await CreatePinPage.tapNumpadZero()
    await CreatePinPage.tapAgreeAndContinueBtn()
    await commonElsPage.tapGetStartedButton()
    await PortfolioPage.verifyPorfolioScreen()
  }

  async recoverManualLogin() {
    await CreatePinPage.tapNumpadZero6Times()
    await commonElsPage.checkIfMainnet()
  }

  async recoverWalletLogin() {
    const seedlessBool = process.env.SEEDLESS_TEST
    if (!seedlessBool || seedlessBool === 'false') {
      console.log(process.env.E2E_MNEMONIC, ' process.env.E2E_MNEMONIC')
      await this.recoverMnemonicWallet()
    } else {
      await this.recoverManualLogin()
      await accountManagePage.switchToFirstAccount()
    }
  }
}

export default new LoginRecoverWallet()
