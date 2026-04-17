import assert from 'assert'
import { actions } from '../../helpers/actions'
import warmup from '../../helpers/warmup'
import onboardingPage from '../../pages/onboarding.page'
import { selectors } from '../../helpers/selectors'

const PRIVACY_SCREEN_OVERLAY = 'privacy_screen_overlay'
// Must exceed TIME_TO_LOCK_IN_SECONDS (5s) defined in store/app/listeners.ts
const BACKGROUND_DURATION_TO_LOCK = 6

describe('Privacy Screen', () => {
  it('[smoke] Privacy Screen - should lock app and require PIN after extended background', async () => {
    await warmup()
    await driver.background(BACKGROUND_DURATION_TO_LOCK)
    // App should be locked — PIN input must be visible
    await actions.waitFor(onboardingPage.pinInputField)
    // Privacy screen overlay has already hidden (isIdled resets after 100ms on foreground)
    const isOverlayVisible = await actions.isElementVisible(
      selectors.getById(PRIVACY_SCREEN_OVERLAY)
    )
    assert.equal(
      isOverlayVisible,
      false,
      'Privacy screen overlay should be hidden after returning to foreground'
    )
  })

  it('[smoke] Privacy Screen - should show portfolio after unlocking', async () => {
    await onboardingPage.tapKeypadUpButton()
    await onboardingPage.tapZero()
    await onboardingPage.verifyLoggedIn()
    const isOverlayVisible = await actions.isElementVisible(
      selectors.getById(PRIVACY_SCREEN_OVERLAY)
    )
    assert.equal(
      isOverlayVisible,
      false,
      'Privacy screen overlay should not be visible after unlock'
    )
  })

  it('Privacy Screen - should not require PIN after short background', async () => {
    // Under TIME_TO_LOCK_IN_SECONDS — app should resume without PIN
    await driver.background(2)
    await onboardingPage.verifyLoggedIn()
    const isOverlayVisible = await actions.isElementVisible(
      selectors.getById(PRIVACY_SCREEN_OVERLAY)
    )
    assert.equal(
      isOverlayVisible,
      false,
      'Privacy screen overlay should not be visible after short background'
    )
  })
})
