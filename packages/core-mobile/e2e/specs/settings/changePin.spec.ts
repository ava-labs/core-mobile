import settings from '../../pages/settings.page'
import { actions } from '../../helpers/actions'
import warmup, { restartAndUnlock } from '../../helpers/warmup'

describe('Settings', () => {
  before(async () => {
    await warmup()
  })

  after(async () => {
    const pin = await restartAndUnlock(['111111', '000000'])
    if (pin !== '000000') {
      await settings.changePinTo(pin, '000000')
    }
  })

  it('Change Pin - should change PIN', async () => {
    // go to change pin page
    await settings.goSettings()
    await settings.tapSecurityAndPrivacy()
    await settings.tapChangePin()
    await settings.enterCurrentPin()
    await settings.setNewPin()
  })

  it('Change Pin - should verify the new pin', async () => {
    // Enter the current pin
    await settings.tapChangePin()
    await settings.enterCurrentPin()
    await actions.isNotVisible(settings.enterYourNewPinTitle)
    // Update the biometrics
    await settings.enterCurrentPin('111111')
    await actions.waitFor(settings.enterYourNewPinTitle)
  })
})
