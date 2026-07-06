import warmup, { killAndRestart } from '../../helpers/warmup'
import onboardingPage from '../../pages/onboarding.page'
import commonElsPage from '../../pages/commonEls.page'

// privacy_screen (testID: 'privacy_screen') is verified in verifyPrivacyScreen()
describe('App Lock', () => {
  before(async () => {
    await warmup()
  })

  it('should unlock the app after backgrounding', async () => {
    await commonElsPage.appGoToBackground(6)
    await commonElsPage.verifyPrivacyScreen()
    await onboardingPage.unlockEnterPin()
    await onboardingPage.verifyLoggedIn()
  })

  it('should unlock the app after kill and restart', async () => {
    await killAndRestart()
    await commonElsPage.verifyPrivacyScreen()
    await onboardingPage.exitMetroAfterLogin()
    await onboardingPage.unlockEnterPin()
    await onboardingPage.verifyLoggedIn()
  })
})
