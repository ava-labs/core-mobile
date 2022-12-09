import ExistingRecoveryPhrasePage from '../pages/existingRecoveryPhrase.page'
import CreatePinPage from '../pages/createPin.page'
import AnalyticsConsentPage from '../pages/analyticsConsent.page'
import delay from '../helpers/waits'
import WatchListPage from '../pages/watchlist.page'
import PortfolioPage from '../pages/portfolio.page'

class LoginRecoverWallet {
  async recoverWalletLogin() {
    const recoveryPhrase: string = process.env.RECOVERY_PHRASE as string
    await WatchListPage.tapWalletSVG()
    await AnalyticsConsentPage.tapNoThanksBtn()
    await ExistingRecoveryPhrasePage.enterRecoveryPhrase(recoveryPhrase)
    await ExistingRecoveryPhrasePage.tapSignInBtn()
    for (let i = 0; i < 12; i++) {
      await CreatePinPage.tapNumpadZero()
      await delay(500)
    }
    await CreatePinPage.tapEmptyCheckbox()
    await CreatePinPage.tapNextBtn()
    await PortfolioPage.verifyPorfolioScreen()
  }
}
export default new LoginRecoverWallet()
