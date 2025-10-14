import settings from '../../pages/settings.page'
import { actions } from '../../helpers/actions'
import warmup from '../../helpers/warmup'

describe('Settings', () => {
  it('Change PIN - should change PIN', async () => {
    // go to change pin page
    await warmup()
    await settings.goSettings()
    await settings.tapSecurityAndPrivacy()
    await settings.tapChangePin()
    await settings.enterCurrentPin()
    await settings.setNewPin()
  })

  it('should verify the new pin', async () => {
    // Enter the current pin
    await settings.tapChangePin()
    await settings.enterCurrentPin()
    await actions.isNotVisible(settings.enterYourNewPinTitle)
    // Update the biometrics
    await settings.enterCurrentPin('111111')
    await actions.waitFor(settings.enterYourNewPinTitle)
  })
})
