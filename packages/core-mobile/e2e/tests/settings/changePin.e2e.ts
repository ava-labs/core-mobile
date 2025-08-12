/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./environment.ts
 */
import { warmup } from '../../helpers/warmup'
import settingsPage from '../../pages/settings.page'
import actions from '../../helpers/actions'
import commonElsPage from '../../pages/commonEls.page'
import assertions from '../../helpers/assertions'

describe('Settings - Change Pin', () => {
  beforeAll(async () => {
    await warmup()
  })

  it('should check the incorrect PIN', async () => {
    // go to change pin page
    await settingsPage.goSettings()
    await settingsPage.tapSecurityAndPrivacy()
    await settingsPage.tapChangePin()

    // Enter an incorrect current pin & verify it's not moving forward
    await actions.waitForElement(settingsPage.enterYourCurrentPinTitle)
    await commonElsPage.enterPin('111111')
    await actions.waitForElementNotVisible(settingsPage.enterYourNewPinTitle)
    await assertions.isVisible(settingsPage.enterYourCurrentPinTitle)
  })

  it('should set a new pin with a biometrics change', async () => {
    // Enter the current pin
    await commonElsPage.enterPin()

    // Update the biometrics
    await actions.waitForElement(settingsPage.enterYourNewPinTitle)
    await assertions.isVisible(settingsPage.unlockWithFaceId)
    await settingsPage.tapBiometrics()
    await actions.waitForElement(settingsPage.toggleBiometricsOff)

    // Change pin with
    await commonElsPage.enterPin('111111')
    await actions.waitForElement(settingsPage.confirmYourNewPinTitle)
    await commonElsPage.enterPin('111111')

    // Confirm the navigation back to Security and Privacy page
    await actions.waitForElement(settingsPage.securityAndPrivacyTitle)
    await assertions.isNotVisible(settingsPage.confirmYourNewPinTitle)
  })

  it('Should verify the biometrics and set a previous pin', async () => {
    // Enter the new pin
    await settingsPage.tapChangePin()
    await commonElsPage.enterPin('111111')

    // Verify the biometrics are updated
    await actions.waitForElement(settingsPage.toggleBiometricsOff, 5000)
    await settingsPage.tapBiometrics(false)
    await assertions.isVisible(settingsPage.toggleBiometricsOn)

    // enter the previous pin
    await commonElsPage.enterPin()
    await actions.waitForElement(settingsPage.confirmYourNewPinTitle)
    await commonElsPage.enterPin()

    // Confirm the navigation back to Security and Privacy page
    await actions.waitForElement(settingsPage.securityAndPrivacyTitle)
    await assertions.isNotVisible(settingsPage.confirmYourNewPinTitle)
  })
})
