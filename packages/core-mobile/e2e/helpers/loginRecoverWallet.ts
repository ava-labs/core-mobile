import ExistingRecoveryPhrasePage from '../pages/existingRecoveryPhrase.page'
import CreatePinPage from '../pages/createPin.page'
import AnalyticsConsentPage from '../pages/analyticsConsent.page'
import PortfolioPage from '../pages/portfolio.page'
import commonElsPage from '../pages/commonEls.page'
import nameWalletPage from '../pages/nameWallet.page'

class LoginRecoverWallet {
  async recoverWalletLogin() {
    const recoveryPhrase: string = process.env.E2E_MNEMONIC as string
    await ExistingRecoveryPhrasePage.tapAlreadyHaveAWalletBtn()
    // await ExistingRecoveryPhrasePage.tapSignInWithRecoveryPhraseBtn()
    await ExistingRecoveryPhrasePage.tapRecoveryPhraseBtn()
    // await ExistingRecoveryPhrasePage.tapForgotPinBtn()
    await AnalyticsConsentPage.tapNoThanksBtn()
    await ExistingRecoveryPhrasePage.enterRecoveryPhrase(recoveryPhrase)
    await ExistingRecoveryPhrasePage.tapSignInBtn()
    await nameWalletPage.enterWalletName('testWallet1\n')
    await CreatePinPage.tapNumpadZero()
    await CreatePinPage.tapNumpadZero()
    await CreatePinPage.tapEmptyCheckbox()
    await CreatePinPage.tapNextBtn()
    await commonElsPage.tapGetStartedButton()
    await PortfolioPage.verifyPorfolioScreen()
  }
}
export default new LoginRecoverWallet()
