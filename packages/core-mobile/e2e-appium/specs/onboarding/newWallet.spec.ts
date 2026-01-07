import { actions } from '../../helpers/actions'
import commonElsPage from '../../pages/commonEls.page'
import onboardingPage from '../../pages/onboarding.page'

describe('[Smoke] Onboarding', () => {
  it('Onboard a new wallet', async () => {
    // exit metro
    await onboardingPage.exitMetro()

    // create new wallet
    await onboardingPage.tapManuallyCreateNewWallet()
    await onboardingPage.tapAgreeAndContinue()
    await onboardingPage.tapNoThanksBtn()

    // get the full recovery phrase
    const words = await onboardingPage.getMnemonicWords()
    await commonElsPage.tapNext()
    await onboardingPage.dismissSecurityWarning()

    // select words
    await actions.waitFor(onboardingPage.verifyYourRecoveryPhraseTitle)
    await onboardingPage.selectWord(words, 'firstWord')
    await onboardingPage.selectWord(words, 'secondWord')
    await onboardingPage.selectWord(words, 'thirdWord')
    await commonElsPage.tapNext()

    // enter pin
    await onboardingPage.enterPin()

    // enter wallet name
    await onboardingPage.enterWalletName()
    await onboardingPage.tapNextBtnOnNameWallet()

    // tap next on avatar screen
    await onboardingPage.tapNextBtnOnAvatarScreen()

    // finish onboarding
    await onboardingPage.tapLetsGo()
    await onboardingPage.verifyLoggedIn()
  })
})
