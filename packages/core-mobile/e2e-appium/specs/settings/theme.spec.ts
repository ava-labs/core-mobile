import warmup from '../../helpers/warmup'
import settingsLoc from '../../locators/settings.loc'
import common from '../../pages/commonEls.page'
import settings from '../../pages/settings.page'

describe('Settings', () => {
  it('Theme - should have system appereance by default', async () => {
    await warmup()
    await settings.goSettings()
    await settings.tapTheme()
    await settings.verifyTheme(settingsLoc.system, [
      settingsLoc.light,
      settingsLoc.dark
    ])
  })

  it('Theme - should change appereance to light', async () => {
    await settings.selectTheme(settingsLoc.light)
    await settings.verifyTheme(settingsLoc.light, [
      settingsLoc.system,
      settingsLoc.dark
    ])
    await common.goBack()
  })

  it('Theme - should change appereance to dark', async () => {
    await settings.tapTheme(false)
    await settings.selectTheme(settingsLoc.dark)
    await settings.verifyTheme(settingsLoc.dark, [
      settingsLoc.system,
      settingsLoc.light
    ])
  })
})
