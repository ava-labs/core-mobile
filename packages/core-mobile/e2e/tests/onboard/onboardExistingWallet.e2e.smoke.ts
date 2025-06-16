/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./environment.ts
 */
import { handleJailbrokenWarning } from '../../helpers/warmup'
import commonElsPage from '../../pages/commonEls.page'
import onboardingPage from '../../pages/onboarding.page'
import actions from '../../helpers/actions'
import onboardingLoc from '../../locators/onboarding.loc'
import bottomTabsPage from '../../pages/bottomTabs.page'
import { ENV } from '../../helpers/getEnvs'

describe('Onboarding Existing Wallet', () => {
  beforeAll(async () => {
    await device.launchApp()
    await commonElsPage.exitMetro()
    await handleJailbrokenWarning()
  })

  it('should onboard the existing wallet', async () => {
    // Start with `Access Existing Wallet` flow
    await onboardingPage.verifyOnboardingPage()
    await onboardingPage.tapAccessExistingWallet()

    // Verify `choose your existing wallet` page
    await onboardingPage.verifyChooseYourExistingWalletPage()
    await onboardingPage.tapTypeInRecoveryPhase()

    // Verify `Terms and Conditions` page
    await onboardingPage.verifyTermsAndConditionsPage()
    await onboardingPage.tapAgreeAndContinue()

    // Verify `Unlock airdrops` page
    await onboardingPage.verifyAnalysticsContentPage()
    await onboardingPage.tapNoThanksBtn()

    // Verify `Enter your recovery phrase` page
    await onboardingPage.verifyEnterYourRecoveryPhrasePage()
    await onboardingPage.enterRecoveryPhrase(ENV.E2E_MNEMONIC as string)
    await onboardingPage.tapImport()

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
