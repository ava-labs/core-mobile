import ExistingRecoveryPhrasePage from '../pages/existingRecoveryPhrase.page'
import CreatePinPage from '../pages/createPin.page'
import AnalyticsConsentPage from '../pages/analyticsConsent.page'
import WatchListPage from '../pages/watchlist.page'
import PortfolioPage from '../pages/portfolio.page'

class LoginRecoverWallet {
  async recoverWalletLogin() {
    const recoveryPhrase: string = process.env.E2E_MNEMONIC as string
    await WatchListPage.tapWalletSVG()
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
