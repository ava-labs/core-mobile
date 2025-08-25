import { warmup } from '../../helpers/warmup'
import commonElsPage from '../../pages/commonEls.page'
import settingsPage from '../../pages/settings.page'

describe('Settings - Core Analytics', () => {
  it('should have the Core Analystics ON by default after login', async () => {
    await warmup()
    await settingsPage.goSettings()
    await settingsPage.tapSecurityAndPrivacy()
    await settingsPage.verifyAnalyticsSwitch()
  })

  it('should toggle on and off the Core Analystics', async () => {
    // disable the switch and verify it is off
    await settingsPage.tapAnalyticsSwitch()
    await settingsPage.verifyAnalyticsSwitch(false)
    await commonElsPage.goBack()
    await settingsPage.tapSecurityAndPrivacy()
    await settingsPage.verifyAnalyticsSwitch(false)

    // enable the switch and verify it's ON
    await settingsPage.tapAnalyticsSwitch(false)
    await commonElsPage.goBack()
    await settingsPage.tapSecurityAndPrivacy()
    await settingsPage.verifyAnalyticsSwitch()
  })
})
