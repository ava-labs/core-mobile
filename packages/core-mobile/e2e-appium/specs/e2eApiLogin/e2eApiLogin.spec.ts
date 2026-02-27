/**
 * E2E API Login
 *
 * E2E_MNEMONIC is passed via launch args in beforeSession.
 * App starts fresh but reads launch args and auto-imports wallet to logged-in state.
 *
 * No warmup() needed - tests run directly in logged-in state.
 */
import onboardingPage from '../../pages/onboarding.page'

describe('E2E API Login', () => {
  it('[Smoke] App starts pre-logged in with portfolio visible', async () => {
    await onboardingPage.exitMetro()

    await onboardingPage.verifyLoggedIn()
  })
})
