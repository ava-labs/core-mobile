/* eslint-disable jest/expect-expect */
/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./environment.ts
 */
import PortfolioPage from '../../pages/portfolio.page'
import Assert from '../../helpers/assertions'
import NewRecoveryPhrasePage from '../../pages/newRecoveryPhrase.page'
import AnalyticsConsentPage from '../../pages/analyticsConsent.page'
import WatchListPage from '../../pages/watchlist.page'
import VerifyPhrasePage from '../../pages/verifyPhrase.page'
import CreatePinPage from '../../pages/createPin.page'
import BottomTabsPage from '../../pages/bottomTabs.page'
import { warmup } from '../../helpers/warmup'

describe('Create new wallet', () => {
  beforeAll(async () => {
    await warmup()
  })

  it('should validate watchlist is shown', async () => {
    await Assert.isVisible(WatchListPage.newWalletIcon, 1)
    await Assert.isVisible(WatchListPage.newWalletBtn)
    await Assert.isVisible(WatchListPage.walletSVG, 1)
  })

  it('should view proper page title and action icons', async () => {
    await WatchListPage.tapNewWalletBtn()
    await AnalyticsConsentPage.tapNoThanksBtn()
    await Assert.isVisible(NewRecoveryPhrasePage.mnemonicWord)
  })

  it('should verify recovery phrase flow', async () => {
    const wordsObject: object =
      await NewRecoveryPhrasePage.mnemonicWordsObject()
    await NewRecoveryPhrasePage.tapIWroteItDownBtn()
    await Assert.isVisible(NewRecoveryPhrasePage.protectFundsModalBackBtn)
    await Assert.isVisible(NewRecoveryPhrasePage.protectFundsModalMsg)
    await Assert.isVisible(NewRecoveryPhrasePage.protectFundsModalTitle)
    await NewRecoveryPhrasePage.tapIUnderstandBtn()
    const confirmWordsArray = await VerifyPhrasePage.selectWordNumbers(
      wordsObject
    )
    await VerifyPhrasePage.tapWordsToConfirm(confirmWordsArray)
    await Assert.isVisible(VerifyPhrasePage.selectWord)
    await VerifyPhrasePage.tapVerifyPhraseBtn()
  })

  it('should successfully create a new wallet', async () => {
    await CreatePinPage.createPin()
    await CreatePinPage.tapEmptyCheckbox()
    await CreatePinPage.tapNextBtn()
    await PortfolioPage.verifyPorfolioScreen()
    await BottomTabsPage.verifyBottomTabs()
  })
})
