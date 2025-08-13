/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./environment.ts
 */
import { warmup } from '../../helpers/warmup'
import settingsPage from '../../pages/settings.page'
import actions from '../../helpers/actions'
import commonElsPage from '../../pages/commonEls.page'
import onboardingPage from '../../pages/onboarding.page'

describe('Settings - Change Pin', () => {
  beforeAll(async () => {
    await warmup()
  })

  it('should change PIN', async () => {
    // go to change pin page
    await settingsPage.goSettings()
    await settingsPage.tapSecurityAndPrivacy()
    await settingsPage.tapChangePin()
    await settingsPage.setNewPin()
    await actions.waitForElement(settingsPage.securityAndPrivacyTitle)
  })

  it('should verify the new pin', async () => {
    // Enter the current pin
    await device.launchApp({ newInstance: true })
    await commonElsPage.exitMetro()
    await commonElsPage.enterPin('000000')
    await actions.waitForElement(onboardingPage.forgotPin)
    // Update the biometrics
    await commonElsPage.enterPin('111111')
    await actions.waitForElementNotVisible(onboardingPage.forgotPin)
    await commonElsPage.verifyLoggedIn()
  })
})
