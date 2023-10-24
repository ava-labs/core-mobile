/* eslint-disable jest/expect-expect */
/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./environment.ts
 */
import PortfolioPage from '../../pages/portfolio.page'
import Assert from '../../helpers/assertions'
import Actions from '../../helpers/actions'
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
    const startTime = new Date().getTime()
    await Actions.waitForElement(AnalyticsConsentPage.noThanksBtn)
    const endTime = new Date().getTime()
    await AnalyticsConsentPage.tapNoThanksBtn()
    const startTime2 = new Date().getTime()
    await Actions.waitForElement(NewRecoveryPhrasePage.iWroteItDownBtn)
    const endTime2 = new Date().getTime()
    await Assert.isVisible(NewRecoveryPhrasePage.mnemonicWord)
    await Actions.reportUIPerformance(
      startTime,
      endTime,
      'HelpUsImproveScreen',
      1,
      3
    )
    await Actions.reportUIPerformance(
      startTime2,
      endTime2,
      'RecoveryPhraseScreen',
      1,
      3
    )
  })

  it('should verify recovery phrase flow', async () => {
    const wordsObject: object =
      await NewRecoveryPhrasePage.mnemonicWordsObject()
    await NewRecoveryPhrasePage.tapIWroteItDownBtn()
    const startTime = new Date().getTime()
    await Actions.waitForElement(NewRecoveryPhrasePage.iUnderstandBtn)
    const endTime = new Date().getTime()
    await Assert.isVisible(NewRecoveryPhrasePage.protectFundsModalBackBtn)
    await Assert.isVisible(NewRecoveryPhrasePage.protectFundsModalMsg)
    await Assert.isVisible(NewRecoveryPhrasePage.protectFundsModalTitle)
    await NewRecoveryPhrasePage.tapIUnderstandBtn()
    const startTime2 = new Date().getTime()
    await Actions.waitForElement(VerifyPhrasePage.verifyPhraseBtn)
    const endTime2 = new Date().getTime()
    const confirmWordsArray = await VerifyPhrasePage.selectWordNumbers(
      wordsObject
    )
    await VerifyPhrasePage.tapWordsToConfirm(confirmWordsArray)
    await Assert.isVisible(VerifyPhrasePage.selectWord)
    await VerifyPhrasePage.tapVerifyPhraseBtn()
    await Actions.reportUIPerformance(
      startTime,
      endTime,
      'IUnderstandScreen',
      1,
      3
    )
    await Actions.reportUIPerformance(
      startTime2,
      endTime2,
      'VerifyPhraseScreen',
      1,
      3
    )
  })

  it('should successfully create a new wallet', async () => {
    await CreatePinPage.createPin()
    await CreatePinPage.tapEmptyCheckbox()
    await CreatePinPage.tapNextBtn()
    await PortfolioPage.verifyPorfolioScreen()
    await BottomTabsPage.verifyBottomTabs()
  })
})
