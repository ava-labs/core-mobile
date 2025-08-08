/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./environment.ts
 */
import actions from '../../helpers/actions'
import { handleJailbrokenWarning } from '../../helpers/warmup'
import onboardingLoc from '../../locators/onboarding.loc'
import bottomTabsPage from '../../pages/bottomTabs.page'
import commonElsPage from '../../pages/commonEls.page'
import onboardingPage from '../../pages/onboarding.page'

describe('Onboard', () => {
  beforeAll(async () => {
    await device.launchApp()
    await commonElsPage.exitMetro()
    await handleJailbrokenWarning()
  })

  it('should onboard a new wallet', async () => {
    // Start with `Access Existing Wallet` flow
    await onboardingPage.verifyOnboardingPage()
    await onboardingPage.tapManuallyCreateNewWallet()

    // Verify `Terms and Conditions` page
    await onboardingPage.verifyTermsAndConditionsPage()
    await onboardingPage.tapAgreeAndContinue()

    // Verify `Unlock airdrops` page
    await onboardingPage.verifyAnalysticsContentPage()
    await onboardingPage.tapNoThanksBtn()

    // Verify `Here is your wallets recovery phrase` page
    await onboardingPage.verifyNewRecoveryPhrasePage()
    const words = await onboardingPage.getMnemonicWords()
    await commonElsPage.tapNext()
    await onboardingPage.verifySecurityWarning()

    // Verify `Verify your recovery phrase` page
    await onboardingPage.verifySelectPhrasePage()
    await onboardingPage.selectWord(words, 'firstWord')
    await onboardingPage.selectWord(words, 'secondWord')
    await onboardingPage.selectWord(words, 'thirdWord')
    await commonElsPage.tapNext()

    // Verify Enter PIN pages
    await onboardingPage.verifyEnterPinPage()
    await commonElsPage.enterPin()
    await actions.waitForElement(onboardingPage.enterPinSecondScreenTitle)
    await commonElsPage.enterPin()

    // Verify `Name your wallet` page
    await onboardingPage.verifyNameYourWalletPage()
    await onboardingPage.enterWalletName(onboardingLoc.walletName)
    await commonElsPage.tapNext()

    // Verify `Select Avatar` page
    await onboardingPage.verifySelectAvatarPage()
    await commonElsPage.tapNext()

    // Verify `Confirmation screen`
    await onboardingPage.verifyConfirmationPage()
    await onboardingPage.tapLetsGo()

    // Verify `Portfolio` page
    await bottomTabsPage.verifyBottomTabs()
  })
})
