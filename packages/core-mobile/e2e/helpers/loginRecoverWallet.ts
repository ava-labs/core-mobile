import ExistingRecoveryPhrasePage from '../pages/existingRecoveryPhrase.page'
import CreatePinPage from '../pages/createPin.page'
import AnalyticsConsentPage from '../pages/analyticsConsent.page'
import PortfolioPage from '../pages/portfolio.page'

class LoginRecoverWallet {
  async recoverWalletLogin() {
    let recoveryPhrase: string = process.env.E2E_MNEMONIC as string
    console.log('recoveryPhrase: ', recoveryPhrase)
    // await ExistingRecoveryPhrasePage.tapAlreadyHaveAWalletBtn()
    recoveryPhrase =
      'rebel mention like slide paddle whale film effort dust visit arrest suit weasel alone mouse various goose blame outer inform behind actress kingdom embark'
    await ExistingRecoveryPhrasePage.tapSignInWithRecoveryPhraseBtn()
    // await ExistingRecoveryPhrasePage.tapRecoveryPhraseBtn()
    await AnalyticsConsentPage.tapNoThanksBtn()
    await ExistingRecoveryPhrasePage.enterRecoveryPhrase(recoveryPhrase)
    await ExistingRecoveryPhrasePage.tapSignInBtn()
    await CreatePinPage.tapNumpadZero()
    await CreatePinPage.tapNumpadZero()
    await CreatePinPage.tapEmptyCheckbox()
    await CreatePinPage.tapNextBtn()
    await PortfolioPage.verifyPorfolioScreen()
  }
}
export default new LoginRecoverWallet()
