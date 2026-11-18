import settings from '../../pages/settings.page'
import { actions } from '../../helpers/actions'
import warmup, { restartAndUnlock } from '../../helpers/warmup'

describe('Settings', () => {
  before(async () => {
    await warmup()
  })

  after(async () => {
    const pin = await restartAndUnlock(['284615', '193746'])
    if (pin !== '193746') {
      await settings.changePinTo(pin, '193746')
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
    await settings.enterCurrentPin('284615')
    await actions.waitFor(settings.enterYourNewPinTitle)
  })
})
