/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./environment.ts
 */
import portfolioPage from '../../pages/portfolio.page'
import newRecoveryPhrasePage from '../../pages/newRecoveryPhrase.page'
import analyticsConsentPage from '../../pages/analyticsConsent.page'
import verifyPhrasePage from '../../pages/verifyPhrase.page'
import createPinPage from '../../pages/createPin.page'
import bottomTabsPage from '../../pages/bottomTabs.page'
import { handleJailbrokenWarning } from '../../helpers/warmup'
import existingRecoveryPhrasePage from '../../pages/existingRecoveryPhrase.page'
import commonElsPage from '../../pages/commonEls.page'
import nameWalletPage from '../../pages/nameWallet.page'
import onboardingPage from '../../pages/onboarding.page'

describe('Create new wallet', () => {
  beforeAll(async () => {
    await device.launchApp()
    await handleJailbrokenWarning()
  })

  it('should view create new wallet via Access Existing Wallet', async () => {
    // Start with `Access Existing Wallet` flow
    await onboardingPage.verifyOnboardingPage()
    await onboardingPage.tapAccessExistingWallet()
    // Verify `choose your existing wallet` page
    await existingRecoveryPhrasePage.verifyChooseYourExistingWalletPage()
    await existingRecoveryPhrasePage.tapTypeInRecoveryPhaseBtn()
    // Verify `choose your existing wallet` page navigation
    await analyticsConsentPage.verifyAnalysticsContentPage()
    await commonElsPage.tapBackButton()
    await existingRecoveryPhrasePage.tapCreateNewWalletBtn()
    await analyticsConsentPage.verifyAnalysticsContentPage()
    await analyticsConsentPage.tapNoThanksBtn()
    await newRecoveryPhrasePage.verifyNewRecoveryPhrasePage()
  })

  it('should view proper page title and action icons', async () => {
    // Start with `Manually Create New Wallet` flow
    await device.launchApp({ newInstance: true })
    await handleJailbrokenWarning()
    await onboardingPage.verifyOnboardingPage()
    await onboardingPage.tapManuallyCreateNewWallet()
    await analyticsConsentPage.verifyAnalysticsContentPage()
    await analyticsConsentPage.tapNoThanksBtn()
  })

  it('should verify recovery phrase flow', async () => {
    await newRecoveryPhrasePage.verifyNewRecoveryPhrasePage()
    await newRecoveryPhrasePage.verifyCopyPhraseModal()
    const wordsObj: object = await newRecoveryPhrasePage.mnemonicWordsObject()
    await newRecoveryPhrasePage.tapIWroteItDownBtn()
    await newRecoveryPhrasePage.verifyProtectYourFundsModal()
    await verifyPhrasePage.verifySelectPhrasePage()
    const wordsArr = await verifyPhrasePage.selectWordNumbers(wordsObj)
    await verifyPhrasePage.tapWordsToConfirm(wordsArr)
    await verifyPhrasePage.tapVerifyPhraseBtn()
  })

  it('should successfully create a new wallet', async () => {
    await nameWalletPage.verifyNameWalletPage()
    await nameWalletPage.enterWalletName('tester1\n')
    await createPinPage.createPin()
    await createPinPage.tapAgreeAndContinueBtn()
    await commonElsPage.tapGetStartedButton()
    await portfolioPage.verifyPorfolioScreen()
    await bottomTabsPage.verifyBottomTabs()
  })
})
