/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./environment.ts
 */
// import PortfolioPage from '../../pages/portfolio.page'
// import Assert from '../../helpers/assertions'
// import Actions from '../../helpers/actions'
// import newRecoveryPhrasePage from '../../pages/newRecoveryPhrase.page'
import analyticsConsentPage from '../../pages/analyticsConsent.page'
// import VerifyPhrasePage from '../../pages/verifyPhrase.page'
// import CreatePinPage from '../../pages/createPin.page'
// import BottomTabsPage from '../../pages/bottomTabs.page'
import { handleJailbrokenWarning } from '../../helpers/warmup'
import existingRecoveryPhrasePage from '../../pages/existingRecoveryPhrase.page'
import commonElsPage from '../../pages/commonEls.page'
// import nameWalletPage from '../../pages/nameWallet.page'
import onboardingPage from '../../pages/onboarding.page'

describe('Create new wallet', () => {
  beforeAll(async () => {
    await device.launchApp()
    await handleJailbrokenWarning()
  })

  it('should view proper page title and action icons', async () => {
    await onboardingPage.verifyOnboardingPage()
    await existingRecoveryPhrasePage.tapAccessExistingWallet()
    await existingRecoveryPhrasePage.verifyChooseYourExistingWalletPage()
    await existingRecoveryPhrasePage.tapCreateNewWalletBtn()
    await analyticsConsentPage.verifyAnalysticsContentPage()
    await commonElsPage.tapBackButton()
    await existingRecoveryPhrasePage.tapTypeInRecoveryPhaseBtn()
    await analyticsConsentPage.verifyAnalysticsContentPage()
    await analyticsConsentPage.tapNoThanksBtn()
  })

  // it('should verify recovery phrase flow', async () => {
  //   const wordsObject: object =
  //     await newRecoveryPhrasePage.mnemonicWordsObject()
  //   await newRecoveryPhrasePage.tapIWroteItDownBtn()
  //   await Actions.waitForElement(newRecoveryPhrasePage.iUnderstandBtn)
  //   await Assert.isVisible(newRecoveryPhrasePage.protectFundsModalBackBtn)
  //   await Assert.isVisible(newRecoveryPhrasePage.protectFundsModalMsg)
  //   await Assert.isVisible(newRecoveryPhrasePage.protectFundsModalTitle)
  //   await newRecoveryPhrasePage.tapIUnderstandBtn()
  //   await Actions.waitForElement(VerifyPhrasePage.verifyPhraseBtn)
  //   const confirmWordsArray = await VerifyPhrasePage.selectWordNumbers(
  //     wordsObject
  //   )
  //   await VerifyPhrasePage.tapWordsToConfirm(confirmWordsArray)
  //   await Assert.isVisible(VerifyPhrasePage.selectWord)
  //   await VerifyPhrasePage.tapVerifyPhraseBtn()
  // })

  // it('should successfully create a new wallet', async () => {
  //   await nameWalletPage.enterWalletName('tester1\n')
  //   await CreatePinPage.createPin()
  //   await CreatePinPage.tapAgreeAndContinueBtn()
  //   await commonElsPage.tapGetStartedButton()
  //   await PortfolioPage.verifyPorfolioScreen()
  //   await BottomTabsPage.verifyBottomTabs()
  // })
})
