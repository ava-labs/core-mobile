/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./environment.ts
 */
import PortfolioPage from '../../pages/portfolio.page'
import Assert from '../../helpers/assertions'
import Actions from '../../helpers/actions'
import NewRecoveryPhrasePage from '../../pages/newRecoveryPhrase.page'
import AnalyticsConsentPage from '../../pages/analyticsConsent.page'
import VerifyPhrasePage from '../../pages/verifyPhrase.page'
import CreatePinPage from '../../pages/createPin.page'
import BottomTabsPage from '../../pages/bottomTabs.page'
import { warmup } from '../../helpers/warmup'
import existingRecoveryPhrasePage from '../../pages/existingRecoveryPhrase.page'
import commonElsPage from '../../pages/commonEls.page'
import nameWalletPage from '../../pages/nameWallet.page'

describe('Create new wallet', () => {
  beforeAll(async () => {
    await warmup()
  })

  it('should view proper page title and action icons', async () => {
    // await existingRecoveryPhrasePage.tapSignInWithRecoveryPhraseBtn()
    await existingRecoveryPhrasePage.tapRecoveryPhraseBtn()
    await Actions.waitForElement(AnalyticsConsentPage.noThanksBtn)
    await AnalyticsConsentPage.tapNoThanksBtn()
    await Actions.waitForElement(NewRecoveryPhrasePage.iWroteItDownBtn)
    await Assert.isVisible(NewRecoveryPhrasePage.mnemonicWord)
  })

  it('should verify recovery phrase flow', async () => {
    const wordsObject: object =
      await NewRecoveryPhrasePage.mnemonicWordsObject()
    await NewRecoveryPhrasePage.tapIWroteItDownBtn()
    await Actions.waitForElement(NewRecoveryPhrasePage.iUnderstandBtn)
    await Assert.isVisible(NewRecoveryPhrasePage.protectFundsModalBackBtn)
    await Assert.isVisible(NewRecoveryPhrasePage.protectFundsModalMsg)
    await Assert.isVisible(NewRecoveryPhrasePage.protectFundsModalTitle)
    await NewRecoveryPhrasePage.tapIUnderstandBtn()
    await Actions.waitForElement(VerifyPhrasePage.verifyPhraseBtn)
    const confirmWordsArray = await VerifyPhrasePage.selectWordNumbers(
      wordsObject
    )
    await VerifyPhrasePage.tapWordsToConfirm(confirmWordsArray)
    await Assert.isVisible(VerifyPhrasePage.selectWord)
    await VerifyPhrasePage.tapVerifyPhraseBtn()
  })

  it('should successfully create a new wallet', async () => {
    await nameWalletPage.enterWalletName('tester1')
    await nameWalletPage.tapGoBtn()
    await CreatePinPage.createPin()
    await CreatePinPage.tapEmptyCheckbox()
    await CreatePinPage.tapNextBtn()
    await commonElsPage.tapGetStartedButton()
    await PortfolioPage.verifyPorfolioScreen()
    await BottomTabsPage.verifyBottomTabs()
  })
})
